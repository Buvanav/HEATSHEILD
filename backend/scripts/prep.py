"""
scripts/prep.py
Data prep script for HeatShield Chennai (Expanded 15x15 Grid - Option A).
Generates:
  1. data/grid.geojson   (225 cells, r0c0 to r14c14, greenery & built_density)
  2. data/poi.json       (Parks, water points, cooling shelters, hospitals across Chennai)
  3. data/road_graph.pkl (NetworkX walking road graph with cell_ids and near_poi flags)
"""

import json
import os
import pickle
import math
import random
import networkx as nx

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Grid parameters (Option A: Greater Urban Core of Chennai)
# From Velachery/Guindy in the south to Anna Nagar/Central in the north,
# and Koyambedu/Vadapalani in the west to Marina Beach/Santhome in the east.
LAT_MIN = 12.9850
LAT_STEP = 0.0055  # ~600m
LON_MIN = 80.1900
LON_STEP = 0.0058  # ~600m
ROWS = 15
COLS = 15

# Named landmarks for Chennai 15x15 grid cells
LANDMARKS = {
    # Row 0: Far South (Velachery, Besant Nagar, Thiruvanmiyur)
    (0, 0): "Ramapuram South",
    (0, 1): "Manapakkam Border",
    (0, 2): "St Thomas Mount South",
    (0, 3): "Adambakkam Lake",
    (0, 4): "Velachery West",
    (0, 5): "Velachery MRTS & Lake",
    (0, 6): "Velachery Bypass",
    (0, 7): "SRP Tools OMR Junction",
    (0, 8): "Taramani Ascendas IT Park",
    (0, 9): "TIDEL Park OMR",
    (0, 10): "Kasturba Nagar Adyar",
    (0, 11): "Thiruvanmiyur Depot",
    (0, 12): "Kalakshetra Colony",
    (0, 13): "Besant Nagar Beach South",
    (0, 14): "Elliot's Beach Promenade",

    # Row 1: Guindy & IIT Madras South
    (1, 0): "Ramapuram DLF IT Park",
    (1, 1): "Nandambakkam Trade Centre",
    (1, 2): "St Thomas Mount Railway Stn",
    (1, 3): "Kathipara Flyover South",
    (1, 4): "Guindy Race Course South",
    (1, 5): "Guindy National Park South",
    (1, 6): "IIT Madras Gajendra Circle",
    (1, 7): "IIT Madras Academic Zone",
    (1, 8): "CLRI Adyar Campus",
    (1, 9): "Adyar Gandhi Nagar",
    (1, 10): "Adyar Flyover Junction",
    (1, 11): "Adyar Cancer Institute",
    (1, 12): "Besant Nagar Church Zone",
    (1, 13): "Besant Nagar 2nd Ave",
    (1, 14): "Elliot's Beach North",

    # Row 2: Guindy, Kotturpuram, Adyar River
    (2, 0): "Porur Junction East",
    (2, 1): "Manapakkam Main Rd",
    (2, 2): "Kathipara Multi-Modal Hub",
    (2, 3): "Guindy Industrial Estate West",
    (2, 4): "Guindy Industrial Estate East",
    (2, 5): "Guindy Metro & Station",
    (2, 6): "Anna University Guindy",
    (2, 7): "Kotturpuram River South",
    (2, 8): "Anna Centenary Library",
    (2, 9): "Adyar River Estuary",
    (2, 10): "Kotturpuram Bridge",
    (2, 11): "Mylapore South / Greenways",
    (2, 12): "Raja Annamalaipuram",
    (2, 13): "Foreshore Estate South",
    (2, 14): "Bay of Bengal Shore South",

    # Row 3: Saidapet, Nandanam, Mandaveli
    (3, 0): "Mugalivakkam Border",
    (3, 1): "Ekkattuthangal Ring Rd",
    (3, 2): "Ekkattuthangal South",
    (3, 3): "Ekkattuthangal Metro",
    (3, 4): "Saidapet Railway Stn",
    (3, 5): "Saidapet Bridge & Bazaar",
    (3, 6): "Chamiers Road Nandanam",
    (3, 7): "Nandanam YMCA Grounds",
    (3, 8): "Boat Club Road",
    (3, 9): "Alwarpet South",
    (3, 10): "Mandaveli Metro",
    (3, 11): "Mandaveli Bus Depot",
    (3, 12): "Santhome High Rd South",
    (3, 13): "Foreshore Estate Promenade",
    (3, 14): "Marina Coastline South",

    # Row 4: Jafferkhanpet, T. Nagar South, Alwarpet
    (4, 0): "Nesapakkam South",
    (4, 1): "Jafferkhanpet South",
    (4, 2): "Jafferkhanpet Main",
    (4, 3): "Kasi Theatre Junction",
    (4, 4): "Saidapet Govt Hospital",
    (4, 5): "CIT Nagar Main Road",
    (4, 6): "Burkit Road T. Nagar",
    (4, 7): "Nandanam Metro Junction",
    (4, 8): "Teynampet Signal / SIET",
    (4, 9): "Eldams Road Junction",
    (4, 10): "Alwarpet Circle",
    (4, 11): "Luz Church Road East",
    (4, 12): "Kapaleeshwarar Temple South",
    (4, 13): "Santhome Cathedral Basilica",
    (4, 14): "Santhome Beach Waves",

    # Row 5: Ashok Nagar, T. Nagar Heart, Mylapore Tank
    (5, 0): "KK Nagar South",
    (5, 1): "Ashok Nagar 100ft Rd",
    (5, 2): "Ashok Nagar Metro",
    (5, 3): "West Mambalam South",
    (5, 4): "Postal Colony Mambalam",
    (5, 5): "T. Nagar Ranganathan St",
    (5, 6): "Panagal Park Hub",
    (5, 7): "Pondy Bazaar Commercial",
    (5, 8): "G N Chetty Road",
    (5, 9): "Teynampet Metro",
    (5, 10): "Music Academy Circle",
    (5, 11): "Mylapore Kutchery Road",
    (5, 12): "Kapaleeshwarar Temple Tank",
    (5, 13): "Kutchery Rd Beach End",
    (5, 14): "Marina Beach Light House",

    # Row 6: Vadapalani South, Usman Rd, Gemini, Royapettah
    (6, 0): "KK Nagar Main Circle",
    (6, 1): "Ashok Pillar Circle",
    (6, 2): "West Mambalam Station",
    (6, 3): "Arya Gowda Road",
    (6, 4): "Duraiswamy Subway",
    (6, 5): "Usman Road Flyover",
    (6, 6): "T. Nagar Bus Terminus",
    (6, 7): "Vani Mahal Junction",
    (6, 8): "Sun Plaza Teynampet",
    (6, 9): "Gemini Flyover / Anna Salai",
    (6, 10): "Semmozhi Poonga Botanical",
    (6, 11): "Royapettah Clock Tower",
    (6, 12): "Royapettah High Road",
    (6, 13): "Ice House Police Station",
    (6, 14): "Marina Beach Gandhi Statue",

    # Row 7: Vadapalani, Kodambakkam, Nungambakkam
    (7, 0): "Saligramam South",
    (7, 1): "Vadapalani 100ft Rd",
    (7, 2): "Vadapalani Metro",
    (7, 3): "Liberty Junction",
    (7, 4): "Kodambakkam Railway Stn",
    (7, 5): "Kodambakkam High Rd",
    (7, 6): "Habibullah Road",
    (7, 7): "Mahalingapuram Ayyappan",
    (7, 8): "Sterling Road South",
    (7, 9): "Nungambakkam High Rd",
    (7, 10): "Thousand Lights Mosque",
    (7, 11): "Royapettah Govt Hospital",
    (7, 12): "Triplicane High Road",
    (7, 13): "Vivekanandar Illam",
    (7, 14): "Marina Beach Promenade Central",

    # Row 8: Vadapalani Temple, Mahalingapuram, Thousand Lights
    (8, 0): "Saligramam Vadapalani",
    (8, 1): "Vadapalani Bus Terminus",
    (8, 2): "Vadapalani Murugan Temple",
    (8, 3): "Trustpuram Kodambakkam",
    (8, 4): "Meenakshi College Zone",
    (8, 5): "Choolaimedu South",
    (8, 6): "Loyola College Grounds",
    (8, 7): "Nungambakkam Bazaar",
    (8, 8): "Nungambakkam Tennis Stadium",
    (8, 9): "Thousand Lights Anna Salai",
    (8, 10): "Express Avenue Mall",
    (8, 11): "Triplicane Big Mosque",
    (8, 12): "Triplicane Parthasarathy Temple",
    (8, 13): "Chepauk Stadium East",
    (8, 14): "Marina Beach Promenade North",

    # Row 9: Arumbakkam, Loyola, Chetpet South, Chepauk
    (9, 0): "Koyambedu Wholesale Border",
    (9, 1): "Arumbakkam Metro",
    (9, 2): "Arumbakkam Main",
    (9, 3): "MMDA Colony South",
    (9, 4): "Choolaimedu Main Road",
    (9, 5): "Gill Nagar Park",
    (9, 6): "Nungambakkam Railway Stn",
    (9, 7): "Sterling Road North",
    (9, 8): "Chetpet South Border",
    (9, 9): "Spur Tank Road Chetpet",
    (9, 10): "Egmore South / Pantheon Rd",
    (9, 11): "Egmore Museum Theatre",
    (9, 12): "Chepauk Stadium West",
    (9, 13): "Chepauk MRTS Station",
    (9, 14): "Marina Beach Anna Memorial",

    # Row 10: Koyambedu, Shenoy Nagar, Chetpet Lake, Egmore
    (10, 0): "Koyambedu CMBT South",
    (10, 1): "Koyambedu Market Hub",
    (10, 2): "Arumbakkam North",
    (10, 3): "MMDA Colony Central",
    (10, 4): "Metha Nagar Subway",
    (10, 5): "Nelson Manickam Rd",
    (10, 6): "Pachaiyappa College Metro",
    (10, 7): "Chetpet Railway Station",
    (10, 8): "Chetpet Eco Park Boating",
    (10, 9): "Mayor Ramanathan Hall",
    (10, 10): "Government Museum Egmore",
    (10, 11): "Egmore Railway Station",
    (10, 12): "Cooum River Chintadripet",
    (10, 13): "Madras University Marina",
    (10, 14): "MGR Memorial Marina",

    # Row 11: Koyambedu Bus Terminus, Aminjikarai, Egmore North
    (11, 0): "Koyambedu CMBT Main Gate",
    (11, 1): "Koyambedu Metro Station",
    (11, 2): "SAF Games Village",
    (11, 3): "Aminjikarai Tollgate",
    (11, 4): "Aminjikarai Market",
    (11, 5): "Ampa Skywalk Mall",
    (11, 6): "Shenoy Nagar South",
    (11, 7): "Kilpauk West / Taylor's Rd",
    (11, 8): "Kilpauk Medical College (KMC)",
    (11, 9): "Nehru Park Metro",
    (11, 10): "Poonamallee High Rd Egmore",
    (11, 11): "Egmore Maternity Hospital",
    (11, 12): "Chintadripet MRTS Station",
    (11, 13): "Omandurar Super Speciality",
    (11, 14): "War Memorial Island Ground",

    # Row 12: Anna Nagar South, Shenoy Nagar, Kilpauk, Central
    (12, 0): "Anna Nagar West Extension",
    (12, 1): "Thirumangalam South",
    (12, 2): "Jawaharlal Nehru Road North",
    (12, 3): "Anna Nagar 3rd Avenue",
    (12, 4): "Shenoy Nagar Metro Station",
    (12, 5): "Thiru Vi Ka Park Shenoy",
    (12, 6): "Kilpauk Garden Road",
    (12, 7): "Kellys Corner Kilpauk",
    (12, 8): "Dr Gurusamy Road",
    (12, 9): "Poonamallee High Rd KMC",
    (12, 10): "Doveton Junction Vepery",
    (12, 11): "Vepery High Road",
    (12, 12): "Periamet Leather Hub",
    (12, 13): "Ripon Building / GCC HQ",
    (12, 14): "Chennai Central Railway Stn",

    # Row 13: Anna Nagar Core, Purasawalkam, Periamet
    (13, 0): "Anna Nagar West Depot",
    (13, 1): "Thirumangalam Metro Hub",
    (13, 2): "Anna Nagar Roundtana West",
    (13, 3): "Anna Nagar 2nd Avenue",
    (13, 4): "Anna Nagar East Metro",
    (13, 5): "Kandhaswamy Naidu College",
    (13, 6): "Aspiran Garden Kilpauk",
    (13, 7): "Kellys Bus Stop",
    (13, 8): "Purasawalkam High Road West",
    (13, 9): "Motilal Street Purasawalkam",
    (13, 10): "Doveton Girls School Zone",
    (13, 11): "Periamet Mosque",
    (13, 12): "Jawaharlal Nehru Stadium",
    (13, 13): "Park Station / Central Square",
    (13, 14): "Rajiv Gandhi Govt General Hosp",

    # Row 14: Anna Nagar Tower, Purasawalkam, George Town South
    (14, 0): "Anna Nagar Tower Park West",
    (14, 1): "Anna Nagar Tower Park",
    (14, 2): "Anna Nagar Roundtana Main",
    (14, 3): "Anna Nagar 1st Avenue",
    (14, 4): "Chintamani Signal Anna Nagar",
    (14, 5): "Villivakkam South Border",
    (14, 6): "ICF Perambur South",
    (14, 7): "Otteri Nullah Passage",
    (14, 8): "Purasawalkam Tank",
    (14, 9): "Purasawalkam Gangadeeswarar",
    (14, 10): "Perambur Barracks Road",
    (14, 11): "Choolai High Road",
    (14, 12): "Elephant Gate Bridge",
    (14, 13): "Wall Tax Road George Town",
    (14, 14): "George Town Commercial West"
}


def generate_grid():
    features = []
    for r in range(ROWS):
        for c in range(COLS):
            cell_id = f"r{r}c{c}"
            lat_start = LAT_MIN + r * LAT_STEP
            lat_end = lat_start + LAT_STEP
            lon_start = LON_MIN + c * LON_STEP
            lon_end = lon_start + LON_STEP

            # Coastal/Beach cooling breeze (Cols 13-14)
            # Guindy / IIT greenery (Rows 0-2, Cols 4-7)
            # Commercial dense hubs (T. Nagar Rows 5-6 Cols 5-8, Purasawalkam Rows 13-14 Cols 8-11)
            if r <= 2 and 4 <= c <= 8:
                # Guindy National Park & IIT Madras
                greenery = round(0.60 + 0.25 * ((r*2 + c) % 5) / 5.0, 2)
                built_density = round(0.15 + 0.20 * ((r + c) % 4) / 4.0, 2)
            elif c >= 13:
                # Marina / Elliot's Beach corridor (higher ventilation, lower building density)
                greenery = round(0.30 + 0.20 * (r % 3) / 3.0, 2)
                built_density = round(0.25 + 0.20 * (r % 4) / 4.0, 2)
            elif 5 <= r <= 7 and 5 <= c <= 8:
                # T. Nagar high density commercial heat island
                greenery = round(0.08 + 0.10 * ((r + c) % 3) / 3.0, 2)
                built_density = round(0.85 + 0.10 * ((r + c) % 2) / 2.0, 2)
            elif 12 <= r <= 14 and 10 <= c <= 14:
                # Chennai Central / Periamet / George Town
                greenery = round(0.10 + 0.10 * (r % 2) / 2.0, 2)
                built_density = round(0.80 + 0.15 * (c % 2) / 2.0, 2)
            else:
                # Mixed urban residential
                val = ((r * 7 + c * 11) % 10) / 10.0
                greenery = round(0.18 + 0.30 * val, 2)
                built_density = round(0.40 + 0.45 * (1 - val), 2)

            # Ensure bounds 0.05 to 0.95
            greenery = min(0.95, max(0.05, greenery))
            built_density = min(0.95, max(0.05, built_density))

            name = LANDMARKS.get((r, c), f"Chennai Sector {cell_id}")

            polygon_coords = [
                [round(lon_start, 6), round(lat_start, 6)],
                [round(lon_end, 6), round(lat_start, 6)],
                [round(lon_end, 6), round(lat_end, 6)],
                [round(lon_start, 6), round(lat_end, 6)],
                [round(lon_start, 6), round(lat_start, 6)]
            ]

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [polygon_coords]
                },
                "properties": {
                    "cell_id": cell_id,
                    "row": r,
                    "col": c,
                    "greenery": greenery,
                    "built_density": built_density,
                    "name": name,
                    "bounds": {
                        "min_lat": round(lat_start, 6),
                        "max_lat": round(lat_end, 6),
                        "min_lon": round(lon_start, 6),
                        "max_lon": round(lon_end, 6)
                    }
                }
            }
            features.append(feature)

    grid_geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    grid_path = os.path.join(DATA_DIR, "grid.geojson")
    with open(grid_path, "w", encoding="utf-8") as f:
        json.dump(grid_geojson, f, indent=2)
    print(f"[OK] Saved grid.geojson with {len(features)} cells to {grid_path}")
    return grid_geojson


def generate_poi():
    pois = [
        # Major Parks (Cooling Canopies)
        {"id": "poi_1", "name": "Guindy National Park Shade Area", "type": "park", "lat": 13.0030, "lon": 80.2220, "cell_id": "r3c5"},
        {"id": "poi_2", "name": "Panagal Park Cooling Tree Canopy", "type": "park", "lat": 13.0400, "lon": 80.2310, "cell_id": "r10c7"},
        {"id": "poi_3", "name": "Semmozhi Poonga Botanical Garden", "type": "park", "lat": 13.0510, "lon": 80.2510, "cell_id": "r12c10"},
        {"id": "poi_4", "name": "Chetpet Eco Park Promenade", "type": "park", "lat": 13.0690, "lon": 80.2410, "cell_id": "r15c8"},
        {"id": "poi_5", "name": "Anna Nagar Tower Park Canopy", "type": "park", "lat": 13.0860, "lon": 80.2140, "cell_id": "r18c4"},
        {"id": "poi_6", "name": "Marina Beach Promenade Cooling Zone", "type": "park", "lat": 13.0530, "lon": 80.2820, "cell_id": "r12c15"},
        {"id": "poi_7", "name": "Gill Nagar Park Choolaimedu", "type": "park", "lat": 13.0610, "lon": 80.2240, "cell_id": "r13c5"},
        {"id": "poi_8", "name": "Nageswara Rao Park Mylapore", "type": "park", "lat": 13.0330, "lon": 80.2640, "cell_id": "r8c12"},

        # Water Points / Hydration Kiosks
        {"id": "poi_9", "name": "Saidapet Metro Hydration Booth", "type": "water_point", "lat": 13.0240, "lon": 80.2210, "cell_id": "r7c5"},
        {"id": "poi_10", "name": "T. Nagar Ranganathan St Water Station", "lat": 13.0420, "lon": 80.2280, "cell_id": "r10c6", "type": "water_point"},
        {"id": "poi_11", "name": "Koyambedu CMBT Hydration Kiosk", "type": "water_point", "lat": 13.0690, "lon": 80.1980, "cell_id": "r15c1"},
        {"id": "poi_12", "name": "Chennai Central Water Fountain Hub", "type": "water_point", "lat": 13.0820, "lon": 80.2750, "cell_id": "r17c14"},
        {"id": "poi_13", "name": "Egmore Railway Stn Hydration Point", "type": "water_point", "lat": 13.0780, "lon": 80.2610, "cell_id": "r16c12"},
        {"id": "poi_14", "name": "Marina Beach Light House Water Point", "type": "water_point", "lat": 13.0400, "lon": 80.2800, "cell_id": "r10c15"},

        # Cooling Shelters
        {"id": "poi_15", "name": "T. Nagar Bus Terminus AC Waiting Hall", "type": "cooling_shelter", "lat": 13.0410, "lon": 80.2330, "cell_id": "r10c7"},
        {"id": "poi_16", "name": "Guindy Multi-Modal Cooling Shelter", "type": "cooling_shelter", "lat": 13.0090, "lon": 80.2130, "cell_id": "r4c3"},
        {"id": "poi_17", "name": "Koyambedu Bus Terminus Passenger Shelter", "type": "cooling_shelter", "lat": 13.0700, "lon": 80.2050, "cell_id": "r15c2"},
        {"id": "poi_18", "name": "Vadapalani Metro Cooling Shelter", "type": "cooling_shelter", "lat": 13.0510, "lon": 80.2120, "cell_id": "r12c3"},

        # Major Hospitals (Heat Emergency Centers)
        {"id": "poi_19", "name": "Rajiv Gandhi Govt General Hospital", "type": "hospital", "lat": 13.0800, "lon": 80.2770, "cell_id": "r17c15"},
        {"id": "poi_20", "name": "Kalaignar Centenary Super Speciality", "type": "hospital", "lat": 13.0070, "lon": 80.2140, "cell_id": "r4c4"},
        {"id": "poi_21", "name": "Kilpauk Medical College Hospital", "type": "hospital", "lat": 13.0810, "lon": 80.2440, "cell_id": "r17c9"},
        {"id": "poi_22", "name": "Government Royapettah Hospital", "type": "hospital", "lat": 13.0560, "lon": 80.2610, "cell_id": "r12c12"},
        {"id": "poi_23", "name": "Saidapet Government Hospital", "type": "hospital", "lat": 13.0180, "lon": 80.2210, "cell_id": "r6c5"}
    ]

    # Re-calculate correct cell_id dynamically
    for p in pois:
        p["cell_id"] = get_cell_id_for_point(p["lat"], p["lon"])

    poi_path = os.path.join(DATA_DIR, "poi.json")
    with open(poi_path, "w", encoding="utf-8") as f:
        json.dump(pois, f, indent=2)
    print(f"[OK] Saved poi.json with {len(pois)} POIs to {poi_path}")
    return pois


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_cell_id_for_point(lat, lon):
    r = int((lat - LAT_MIN) / LAT_STEP)
    c = int((lon - LON_MIN) / LON_STEP)
    r = max(0, min(ROWS - 1, r))
    c = max(0, min(COLS - 1, c))
    return f"r{r}c{c}"


def generate_road_graph(pois):
    """
    Creates a NetworkX DiGraph representing walkable street network across the 15x15 Chennai grid.
    """
    G = nx.DiGraph()

    # Create intersection nodes across the 15x15 grid
    nodes_lat_count = ROWS + 1
    nodes_lon_count = COLS + 1

    d_lat = (LAT_STEP * ROWS) / (nodes_lat_count - 1)
    d_lon = (LON_STEP * COLS) / (nodes_lon_count - 1)

    node_matrix = {}
    for i in range(nodes_lat_count):
        for j in range(nodes_lon_count):
            node_id = f"n_{i}_{j}"
            lat = LAT_MIN + i * d_lat
            lon = LON_MIN + j * d_lon
            # Micro-jitter for realistic street layout
            lat_j = lat + (random.uniform(-0.0002, 0.0002) if 0 < i < nodes_lat_count-1 else 0)
            lon_j = lon + (random.uniform(-0.0002, 0.0002) if 0 < j < nodes_lon_count-1 else 0)

            G.add_node(node_id, x=lon_j, y=lat_j, lat=lat_j, lon=lon_j)
            node_matrix[(i, j)] = node_id

    poi_coords = [(p["lat"], p["lon"]) for p in pois if p["type"] in ("park", "water_point")]

    for i in range(nodes_lat_count):
        for j in range(nodes_lon_count):
            curr_id = node_matrix[(i, j)]
            curr_node = G.nodes[curr_id]

            neighbors = []
            if j + 1 < nodes_lon_count:
                neighbors.append((i, j + 1))  # East
            if i + 1 < nodes_lat_count:
                neighbors.append((i + 1, j))  # North
            if i + 1 < nodes_lat_count and j + 1 < nodes_lon_count and (i + j) % 3 == 0:
                neighbors.append((i + 1, j + 1))  # Diagonal NE
            if i + 1 < nodes_lat_count and j - 1 >= 0 and (i + j) % 4 == 0:
                neighbors.append((i + 1, j - 1))  # Diagonal NW

            for (ni, nj) in neighbors:
                neigh_id = node_matrix[(ni, nj)]
                neigh_node = G.nodes[neigh_id]

                mid_lat = (curr_node["lat"] + neigh_node["lat"]) / 2.0
                mid_lon = (curr_node["lon"] + neigh_node["lon"]) / 2.0

                cell_id = get_cell_id_for_point(mid_lat, mid_lon)
                length_m = haversine_m(curr_node["lat"], curr_node["lon"], neigh_node["lat"], neigh_node["lon"])
                near_poi = any(haversine_m(mid_lat, mid_lon, plat, plon) <= 150.0 for (plat, plon) in poi_coords)

                G.add_edge(curr_id, neigh_id, length_m=length_m, length=length_m, cell_id=cell_id, near_poi=near_poi)
                G.add_edge(neigh_id, curr_id, length_m=length_m, length=length_m, cell_id=cell_id, near_poi=near_poi)

    graph_path = os.path.join(DATA_DIR, "road_graph.pkl")
    with open(graph_path, "wb") as f:
        pickle.dump(G, f, protocol=pickle.HIGHEST_PROTOCOL)

    print(f"[OK] Saved road_graph.pkl with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges to {graph_path}")
    return G


def main():
    print("Initializing HeatShield Chennai Data Prep (Option A: 15x15 Expanded Urban Grid)...")
    random.seed(42)
    generate_grid()
    pois = generate_poi()
    generate_road_graph(pois)
    print("\nData preparation complete!")


if __name__ == "__main__":
    main()
