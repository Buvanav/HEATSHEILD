// src/components/MapView.jsx
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { translations } from '../i18n/translations';
import { Thermometer, ShieldCheck, AlertTriangle, Droplets, Radio } from 'lucide-react';

export default function MapView({ 
  cellsGeoJSON, 
  onCellClick, 
  selectedCell, 
  routeData, 
  sensors = [], 
  waterPoints = [], 
  lang 
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const sensorMarkersRef = useRef([]);
  const waterMarkersRef = useRef([]);
  const popupRef = useRef(null);

  const t = translations[lang] || translations.en;
  const tm = t.mapScreen;

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [80.2300, 13.0300], // T. Nagar - Guindy center
      zoom: 13.2,
      pitch: 0,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      // Add Grid GeoJSON Source
      map.addSource('heat-cells', {
        type: 'geojson',
        data: cellsGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      // Polygon Fill Layer (Heat Color Coding)
      map.addLayer({
        id: 'heat-cells-fill',
        type: 'fill',
        source: 'heat-cells',
        paint: {
          'fill-color': [
            'match',
            ['get', 'band'],
            'red', '#ef4444',
            'amber', '#f59e0b',
            'green', '#22c55e',
            '#f59e0b'
          ],
          'fill-opacity': [
            'match',
            ['get', 'band'],
            'red', 0.55,
            'amber', 0.48,
            'green', 0.42,
            0.45
          ]
        }
      });

      // Polygon Border Grid Layer
      map.addLayer({
        id: 'heat-cells-border',
        type: 'line',
        source: 'heat-cells',
        paint: {
          'line-color': '#1e293b',
          'line-width': 1,
          'line-opacity': 0.6
        }
      });

      // Highlighted Selected Cell Border Layer
      map.addLayer({
        id: 'heat-cells-highlight',
        type: 'line',
        source: 'heat-cells',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3.5,
          'line-opacity': 1.0
        },
        filter: ['==', ['get', 'cell_id'], '']
      });

      // Route Sources & Layers
      map.addSource('route-fastest', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'route-fastest-line',
        type: 'line',
        source: 'route-fastest',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 4,
          'line-dasharray': [2, 2]
        }
      });

      map.addSource('route-coolest', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'route-coolest-line',
        type: 'line',
        source: 'route-coolest',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#06b6d4',
          'line-width': 6,
          'line-opacity': 0.95
        }
      });

      // Map Click Event for Inspecting Grid Cell
      map.on('click', 'heat-cells-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;

        onCellClick(feature);

        // Render Popup
        if (popupRef.current) popupRef.current.remove();

        const bandColor = props.band === 'red' ? '#ef4444' : props.band === 'amber' ? '#f59e0b' : '#22c55e';
        const bandText = props.band === 'red' ? t.bands.red : props.band === 'amber' ? t.bands.amber : t.bands.green;

        const popupContent = `
          <div style="font-family: Inter, sans-serif; font-size: 12px; color: #f8fafc; min-width: 190px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:8px;">
              <strong style="font-size: 14px; color: ${bandColor}; font-weight:800;">Cell ${props.cell_id}</strong>
              <span style="background:${bandColor}; color:#0f172a; padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px; text-transform:uppercase;">
                ${bandText}
              </span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#020617; padding:8px; border-radius:6px; border:1px solid #1e293b; margin-bottom:8px;">
              <div>
                <div style="color:#94a3b8; font-size:10px;">${tm.heatIndex}</div>
                <strong style="color:#f8fafc; font-size:13px;">${props.heat_index}°C</strong>
              </div>
              <div>
                <div style="color:#94a3b8; font-size:10px;">Risk Score</div>
                <strong style="color:${bandColor}; font-size:13px;">${props.score}/100</strong>
              </div>
              <div>
                <div style="color:#94a3b8; font-size:10px;">${tm.greenery}</div>
                <strong style="color:#22c55e; font-size:12px;">${props.greenery}%</strong>
              </div>
              <div>
                <div style="color:#94a3b8; font-size:10px;">${tm.builtDensity}</div>
                <strong style="color:#f43f5e; font-size:12px;">${props.built_density}%</strong>
              </div>
            </div>
            <div style="color:#cbd5e1; font-size:11px; text-align:center; background:rgba(239,68,68,0.15); padding:4px; border-radius:4px; border:1px solid rgba(239,68,68,0.3);">
              Unsafe Window: 11:30 AM - 3:30 PM
            </div>
          </div>
        `;

        popupRef.current = new maplibregl.Popup({ closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map);
      });

      // Cursor hover feedback
      map.on('mouseenter', 'heat-cells-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'heat-cells-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update GeoJSON source when cells change
  useEffect(() => {
    if (!mapRef.current || !cellsGeoJSON) return;
    const source = mapRef.current.getSource('heat-cells');
    if (source) {
      source.setData(cellsGeoJSON);
    }
  }, [cellsGeoJSON]);

  // Update highlighted cell border filter
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getLayer('heat-cells-highlight')) return;
    const selectedId = selectedCell?.properties?.cell_id || selectedCell?.cell_id || '';
    mapRef.current.setFilter('heat-cells-highlight', ['==', ['get', 'cell_id'], selectedId]);

    if (selectedCell) {
      // Center map on selected cell
      let coords;
      if (selectedCell.geometry?.coordinates) {
        coords = selectedCell.geometry.coordinates[0][0];
      } else if (selectedCell.lat && selectedCell.lon) {
        coords = [selectedCell.lon, selectedCell.lat];
      }
      if (coords) {
        mapRef.current.flyTo({ center: coords, zoom: 14.5, duration: 1000 });
      }
    }
  }, [selectedCell]);

  // Render Routes Polylines
  useEffect(() => {
    if (!mapRef.current) return;
    const fastestSource = mapRef.current.getSource('route-fastest');
    const coolestSource = mapRef.current.getSource('route-coolest');

    if (routeData) {
      if (fastestSource) {
        fastestSource.setData({
          type: 'Feature',
          geometry: routeData.fastest.geometry
        });
      }
      if (coolestSource) {
        coolestSource.setData({
          type: 'Feature',
          geometry: routeData.coolest.geometry
        });
      }

      // Fit map to route bounds
      const coords = routeData.coolest.geometry.coordinates;
      const bounds = coords.reduce((acc, coord) => {
        return acc.extend(coord);
      }, new maplibregl.LngLatBounds(coords[0], coords[0]));

      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    } else {
      if (fastestSource) fastestSource.setData({ type: 'FeatureCollection', features: [] });
      if (coolestSource) coolestSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [routeData]);

  // Render Live Sensor HTML Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing sensor markers
    sensorMarkersRef.current.forEach(m => m.remove());
    sensorMarkersRef.current = [];

    sensors.forEach((s) => {
      const el = document.createElement('div');
      const isHot = s.temp >= 40.0;

      el.className = 'relative flex items-center justify-center cursor-pointer';
      el.innerHTML = `
        <div style="position:relative; display:flex; items-center; justify-content:center;">
          <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:${isHot ? '#ef4444' : '#10b981'}; opacity:0.4;" class="sensor-pulse"></div>
          <div style="background:${isHot ? '#ef4444' : '#0f172a'}; color:${isHot ? '#ffffff' : '#34d399'}; border:1.5px solid ${isHot ? '#fca5a5' : '#10b981'}; padding:3px 7px; border-radius:12px; font-weight:800; font-size:11px; font-family:Inter, sans-serif; box-shadow:0 4px 6px -1px rgba(0,0,0,0.5); display:flex; align-items:center; gap:3px;">
            <span>●</span> ${s.temp}°C
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true })
          .setLngLat([s.lon, s.lat])
          .setHTML(`
            <div style="font-family:Inter, sans-serif; font-size:12px; color:#f8fafc;">
              <strong style="color:#34d399; font-size:13px;">${s.name}</strong>
              <div style="margin-top:4px; font-size:11px; color:#cbd5e1;">Cell: <strong>${s.cell_id}</strong></div>
              <div style="font-size:15px; font-weight:800; color:${isHot ? '#ef4444' : '#34d399'}; margin:4px 0;">${s.temp}°C | Humidity ${s.humidity}</div>
              <div style="font-size:10px; color:#94a3b8;">Updated: ${s.updated_at}</div>
            </div>
          `)
          .addTo(mapRef.current);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([s.lon, s.lat])
        .addTo(mapRef.current);

      sensorMarkersRef.current.push(marker);
    });
  }, [sensors]);

  // Render Suggested Water Points HTML Markers
  useEffect(() => {
    if (!mapRef.current) return;

    waterMarkersRef.current.forEach(m => m.remove());
    waterMarkersRef.current = [];

    waterPoints.forEach((wp) => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer animate-bounce';
      el.innerHTML = `
        <div style="background:#06b6d4; color:#0f172a; padding:4px 8px; border-radius:16px; font-weight:800; font-size:11px; border:2px solid #ffffff; box-shadow:0 4px 10px rgba(6,182,212,0.6); display:flex; align-items:center; gap:4px;">
          <span>💧 Water Station</span>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([wp.lon, wp.lat])
        .addTo(mapRef.current);

      waterMarkersRef.current.push(marker);
    });
  }, [waterPoints]);

  return (
    <div className="relative w-full h-full min-h-[450px]">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-800" />

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-lg text-xs flex flex-col gap-2 max-w-[210px]">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
          {tm.legendTitle}
        </div>
        <div className="flex flex-col gap-1.5 font-medium text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-emerald-400">{tm.legendGreen}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-amber-400">{tm.legendAmber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span className="text-rose-400">{tm.legendRed}</span>
          </div>
        </div>
      </div>


    </div>
  );
}
