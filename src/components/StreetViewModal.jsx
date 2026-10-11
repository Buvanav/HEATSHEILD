// src/components/StreetViewModal.jsx
import React from 'react';
import { Camera, X, Thermometer, ShieldCheck, AlertTriangle, Clock, MapPin, TreeDeciduous, Building } from 'lucide-react';

export default function StreetViewModal({ cell, riskDetails, onClose, lang }) {
  if (!cell && !riskDetails) return null;

  // Extract cell parameters
  const props = cell?.properties || cell || {};
  const cellId = props.cell_id || riskDetails?.cell_id || 'r4c6';
  const name = props.name || `Sector ${cellId}`;
  const score = props.score ?? riskDetails?.score ?? 50;
  const band = props.band || riskDetails?.band || 'amber';
  const heatIndex = props.heat_index || '38.5';
  const greenery = props.greenery || 25;
  const builtDensity = props.built_density || 75;

  // Extract lat/lon coordinates for Street View Embed
  let lat = 13.0405;
  let lon = 80.2335;
  if (cell?.geometry?.coordinates) {
    const polygonCoords = cell.geometry.coordinates[0][0];
    lon = polygonCoords[0];
    lat = polygonCoords[1];
  } else if (cell?.lat && cell?.lon) {
    lat = cell.lat;
    lon = cell.lon;
  }

  const bandColor = band === 'red' ? '#ef4444' : band === 'amber' ? '#f59e0b' : '#10b981';
  const bandText = band === 'red' ? 'HIGH RISK' : band === 'amber' ? 'MODERATE RISK' : 'LOW RISK';

  const adviceText = lang === 'ta'
    ? (riskDetails?.advice_ta || "கடுமையான வெப்பம்! நிழலான இடத்தில் 15 நிமிடங்கள் ஓய்வெடுத்து நீர் அருந்தவும்.")
    : (riskDetails?.advice_en || "Very hot now. Rest in shade and drink water frequently.");

  const unsafeWindow = riskDetails?.unsafe_window || { start: "11:30 AM", end: "03:30 PM" };

  // Google Maps Street View Embed URL (No API key required)
  const streetViewUrl = `https://maps.google.com/maps?q=${lat},${lon}&layer=c&cbll=${lat},${lon}&cbp=12,0,0,0,0&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full flex flex-col h-[90vh] max-h-[750px] text-slate-100 relative">
        
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-950 border border-rose-800/80 text-rose-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Street View Micro-Climate Inspection</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: bandColor, color: '#0f172a' }}>
                  {cellId} • {bandText}
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{name} ({lat.toFixed(4)}°N, {lon.toFixed(4)}°E)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP HALF: 360° Interactive Street View Viewport */}
        <div className="relative flex-1 bg-slate-950 w-full min-h-[300px]">
          <iframe
            title={`Street View for ${name}`}
            src={streetViewUrl}
            className="w-full h-full border-0"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Floating Street View Live Overlay Badge */}
          <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg text-xs flex items-center gap-2 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: bandColor }} />
            <span className="font-semibold text-slate-100">Live Street Overlay</span>
          </div>
        </div>

        {/* BOTTOM HALF: Heat Risk Dashboard Panel */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col gap-3">
          
          {/* Micro-Climate Metric Grid */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            
            {/* Heat Index */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Heat Index</span>
              </div>
              <span className="font-bold text-slate-100 text-sm mt-0.5">{heatIndex}°C</span>
            </div>

            {/* Risk Score */}
            <div className="flex flex-col items-center justify-center text-center border-l border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Risk Score</span>
              </div>
              <span className="font-bold text-sm mt-0.5" style={{ color: bandColor }}>{score}/100</span>
            </div>

            {/* Greenery Cover */}
            <div className="flex flex-col items-center justify-center text-center border-l border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" />
                <span>Greenery</span>
              </div>
              <span className="font-bold text-emerald-400 text-sm mt-0.5">{greenery}%</span>
            </div>

            {/* Built Density */}
            <div className="flex flex-col items-center justify-center text-center border-l border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Built Density</span>
              </div>
              <span className="font-bold text-rose-400 text-sm mt-0.5">{builtDensity}%</span>
            </div>

          </div>

          {/* Unsafe Time Window & Advice */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            
            {/* Unsafe Hours Window */}
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2.5 sm:w-1/3">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-medium text-slate-400 uppercase">Unsafe Window</div>
                <div className="font-bold text-amber-300 text-xs font-mono">{unsafeWindow.start} – {unsafeWindow.end}</div>
              </div>
            </div>

            {/* Safety Advice */}
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2.5 sm:w-2/3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-slate-300 font-normal leading-tight">
                {adviceText}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
