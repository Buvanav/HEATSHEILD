"""
backend/app/services/routing.py
NetworkX Dijkstra shortest-path router for HeatShield Chennai.
Computes fastest walking route vs coolest route with heat exposure metrics.
Graph is cached in module memory to minimize cold-start latencies.
"""

import os
import pickle
import math
import logging
from typing import Dict, Any, Tuple, List, Optional
import networkx as nx
from app import config

logger = logging.getLogger("heatshield.routing")

# Module-level graph cache for AWS Lambda container re-use
_CACHED_GRAPH: Optional[nx.DiGraph] = None


def load_graph() -> nx.DiGraph:
    """
    Loads networkx road graph pickle file. Caches in memory.
    """
    global _CACHED_GRAPH
    if _CACHED_GRAPH is not None:
        return _CACHED_GRAPH

    graph_path = config.GRAPH_FILE
    if not os.path.exists(graph_path):
        logger.warning(f"Graph file {graph_path} not found. Running auto prep...")
        # Import prep module dynamically if missing
        from scripts import prep
        prep.main()

    with open(graph_path, "rb") as f:
        _CACHED_GRAPH = pickle.load(f)

    logger.info(f"Loaded road graph with {_CACHED_GRAPH.number_of_nodes()} nodes.")
    return _CACHED_GRAPH


def find_nearest_node(G: nx.DiGraph, lat: float, lon: float) -> str:
    """
    Finds the nearest graph node ID for a given lat/lon coordinate.
    """
    min_dist = float("inf")
    nearest_node = list(G.nodes)[0]

    for node_id, attrs in G.nodes(data=True):
        n_lat = attrs.get("lat", attrs.get("y"))
        n_lon = attrs.get("lon", attrs.get("x"))
        if n_lat is not None and n_lon is not None:
            dist = (n_lat - lat) ** 2 + (n_lon - lon) ** 2
            if dist < min_dist:
                min_dist = dist
                nearest_node = node_id

    return nearest_node


def compute_route_exposure(G: nx.DiGraph, path_nodes: List[str], cell_scores: Dict[str, float]) -> float:
    """
    Computes distance-weighted average heat exposure score (0 - 100) along the route.
    """
    total_weighted_score = 0.0
    total_meters = 0.0
    for u, v in zip(path_nodes[:-1], path_nodes[1:]):
        edge_data = G.get_edge_data(u, v, default={})
        length_m = edge_data.get("length_m", 50.0)
        cell_id = edge_data.get("cell_id", "r0c0")
        score = cell_scores.get(cell_id, 50.0)
        total_weighted_score += length_m * score
        total_meters += length_m

    if total_meters > 0:
        return round(total_weighted_score / total_meters, 1)
    return 50.0


def compute_route_minutes(G: nx.DiGraph, path_nodes: List[str], walking_speed_m_per_min: float = 75.0) -> float:
    """
    Walking speed ~ 4.5 km/h -> 75 meters per minute.
    """
    total_meters = 0.0
    for u, v in zip(path_nodes[:-1], path_nodes[1:]):
        edge_data = G.get_edge_data(u, v, default={})
        total_meters += edge_data.get("length_m", 50.0)

    return round(total_meters / walking_speed_m_per_min, 1)


def extract_path_geometry(G: nx.DiGraph, path_nodes: List[str]) -> Dict[str, Any]:
    """
    Returns GeoJSON LineString coordinates [[lon, lat], ...]
    """
    coords = []
    for n in path_nodes:
        attrs = G.nodes[n]
        lon = attrs.get("lon", attrs.get("x"))
        lat = attrs.get("lat", attrs.get("y"))
        coords.append([round(lon, 6), round(lat, 6)])

    return {
        "type": "LineString",
        "coordinates": coords
    }


def find_routes(
    from_lat: float,
    from_lon: float,
    to_lat: float,
    to_lon: float,
    cell_scores: Dict[str, float]
) -> Dict[str, Any]:
    """
    Calculates both fastest and coolest routes between two coordinates.
    """
    import itertools
    G = load_graph()

    start_node = find_nearest_node(G, from_lat, from_lon)
    end_node = find_nearest_node(G, to_lat, to_lon)

    # 1. Assign dynamic edge weights to graph
    # Fastest weight = length_m
    # Coolest weight penalizes hot sectors and rewards shade canopies & water points
    for u, v, d in G.edges(data=True):
        length_m = d.get("length_m", 50.0)
        cell_id = d.get("cell_id", "r0c0")
        near_poi = d.get("near_poi", False)
        score = cell_scores.get(cell_id, 50.0)

        d["fastest_weight"] = length_m
        heat_mult = (score / 45.0) ** 2.5
        poi_mult = 0.55 if near_poi else 1.0
        d["coolest_weight"] = length_m * heat_mult * poi_mult

    # 2. Run Dijkstra for fastest path
    try:
        fastest_path = nx.shortest_path(G, source=start_node, target=end_node, weight="fastest_weight")
    except nx.NetworkXNoPath:
        fastest_path = [start_node, end_node]

    # 3. Run Dijkstra for coolest path
    try:
        coolest_path = nx.shortest_path(G, source=start_node, target=end_node, weight="coolest_weight")
    except nx.NetworkXNoPath:
        coolest_path = fastest_path

    fastest_exp = compute_route_exposure(G, fastest_path, cell_scores)
    fastest_min = compute_route_minutes(G, fastest_path)

    # If coolest path is identical to fastest, explore alternative nearby shade corridor
    if coolest_path == fastest_path:
        try:
            paths_iter = nx.shortest_simple_paths(G, source=start_node, target=end_node, weight="coolest_weight")
            for alt_path in itertools.islice(paths_iter, 1, 10):
                alt_exp = compute_route_exposure(G, alt_path, cell_scores)
                alt_min = compute_route_minutes(G, alt_path)
                if alt_min <= fastest_min * 1.30 and alt_exp < fastest_exp:
                    coolest_path = alt_path
                    break
        except Exception:
            pass

    coolest_exp = compute_route_exposure(G, coolest_path, cell_scores)
    coolest_min = compute_route_minutes(G, coolest_path)

    # Percentage reduction in exposure
    if fastest_exp > 0 and fastest_exp > coolest_exp:
        red_pct = max(0.0, round(((fastest_exp - coolest_exp) / fastest_exp) * 100.0, 1))
    else:
        red_pct = 0.0

    return {
        "fastest": {
            "geometry": extract_path_geometry(G, fastest_path),
            "minutes": fastest_min,
            "exposure": fastest_exp
        },
        "coolest": {
            "geometry": extract_path_geometry(G, coolest_path),
            "minutes": coolest_min,
            "exposure": coolest_exp
        },
        "exposure_reduction_pct": red_pct
    }
