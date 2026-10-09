// src/components/LiveSensors.jsx
import React, { useEffect, useState } from 'react';
import { Radio, AlertTriangle, RefreshCw, Thermometer, Droplets, Clock, MapPin } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function LiveSensors({ sensors = [], onRefresh, lang }) {
  const t = translations[lang] || translations.en;
  const ts = t.sensors;

  const [isRefreshing, setIsRefreshing] = useState(false);

  // High temperature spike (>40°C)
  const spikedSensors = sensors.filter(s => s.temp >= 40.0);
  const hasSpike = spikedSensors.length > 0;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl text-slate-100 flex flex-col gap-4 max-w-4xl mx-auto w-full">
      
      {/* High Heat Alert Banner */}
      {hasSpike && (
        <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-3 flex items-center justify-between gap-3 text-rose-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-rose-900 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">{ts.spikeAlert}</h3>
              <p className="text-xs text-rose-300 font-normal">
                {ts.spikeDesc} ({spikedSensors.map(s => `${s.name}: ${s.temp}°C`).join(', ')})
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-rose-800 text-white rounded">
            ALERT
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{ts.title}</h2>
            <p className="text-xs text-slate-400 font-normal">{ts.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {sensors.length} {ts.activeSensors}
          </span>

          <button
            onClick={handleManualRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Sensors"
            aria-label="Refresh sensors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sensors.map((sensor) => {
          const isHot = sensor.temp >= 40.0;

          return (
            <div 
              key={sensor.id}
              className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                isHot 
                  ? 'bg-rose-950/20 border-rose-800/80' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {sensor.name}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {sensor.cell_id}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className={`w-4 h-4 ${isHot ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span className={`text-xl font-bold ${isHot ? 'text-rose-400' : 'text-amber-300'}`}>
                      {sensor.temp}°C
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-cyan-400">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{sensor.humidity}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {sensor.updated_at}
                </span>
                <span className="font-semibold text-emerald-400">Live</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

