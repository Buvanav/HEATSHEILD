// src/components/RoutePanel.jsx
import React, { useState } from 'react';
import { Navigation, Clock, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { translations } from '../i18n/translations';

const PRESETS = [
  { name: 'T. Nagar Bus Stand', coords: '13.0410,80.2335' },
  { name: 'Guindy Station', coords: '13.0090,80.2120' },
  { name: 'Saidapet Metro', coords: '13.0245,80.2220' },
  { name: 'Panagal Park', coords: '13.0400,80.2290' },
  { name: 'Anna University', coords: '13.0110,80.2360' },
];

export default function RoutePanel({ 
  onCalculateRoute, 
  routeData, 
  loading, 
  lang,
  onClose
}) {
  const t = translations[lang] || translations.en;
  const tr = t.routes;

  const [from, setFrom] = useState(PRESETS[0].coords);
  const [to, setTo] = useState(PRESETS[1].coords);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (from && to) {
      onCalculateRoute(from, to);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl text-slate-100 flex flex-col gap-4 max-w-md w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{tr.title}</h2>
            <p className="text-xs text-slate-400 font-normal">{tr.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {tr.presetLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.coords}
              onClick={() => {
                if (from === p.coords) setTo(PRESETS[1].coords);
                else setFrom(p.coords);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors font-medium"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form Input Pickers */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{tr.origin}</span>
          </label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {PRESETS.map((p) => (
              <option key={p.coords} value={p.coords}>{p.name} ({p.coords})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tr.destination}</span>
          </label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {PRESETS.map((p) => (
              <option key={p.coords} value={p.coords}>{p.name} ({p.coords})</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[36px]"
        >
          {loading ? (
            <span>Computing Shade Path...</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tr.calculate}</span>
            </>
          )}
        </button>
      </form>

      {/* Comparison Results Card */}
      {routeData && (
        <div className="flex flex-col gap-3">
          
          {/* Highlight Badge */}
          <div className="bg-emerald-950/60 border border-emerald-700/60 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">{tr.reduction}</span>
                <span className="text-sm font-bold text-emerald-300">
                  {routeData.exposure_reduction_pct}% {tr.lessHeat}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-700 text-white font-semibold px-2 py-0.5 rounded">
              OPTIMIZED
            </span>
          </div>

          {/* Side by Side Comparison Cards */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            
            {/* Fastest Route */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-400">{tr.fastest}</span>
                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
              </div>
              <div className="flex items-baseline gap-1 text-slate-200 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-sm">{routeData.fastest.minutes}</span>
                <span className="text-[10px] text-slate-400">{tr.minutes}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {tr.heatExposure}: <strong className="text-rose-400">{routeData.fastest.exposure}/100</strong>
              </div>
            </div>

            {/* Coolest Route */}
            <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-800/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400">{tr.coolest}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              </div>
              <div className="flex items-baseline gap-1 text-emerald-200 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-sm">{routeData.coolest.minutes}</span>
                <span className="text-[10px] text-emerald-400">{tr.minutes}</span>
              </div>
              <div className="text-[11px] text-emerald-300 mt-0.5">
                {tr.heatExposure}: <strong className="text-emerald-400">{routeData.coolest.exposure}/100</strong>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

