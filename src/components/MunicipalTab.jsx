// src/components/MunicipalTab.jsx
import React, { useState } from 'react';
import { Building2, Droplets, MapPin, CheckCircle2, AlertOctagon } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function MunicipalTab({ 
  data = [], 
  onSelectCell, 
  onAddWaterPoint, 
  waterPoints = [], 
  lang 
}) {
  const t = translations[lang] || translations.en;
  const tm = t.municipal;

  const [lastDispatched, setLastDispatched] = useState(null);

  const handleWaterPointClick = (cell) => {
    onAddWaterPoint(cell);
    setLastDispatched(cell);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl text-slate-100 flex flex-col gap-4 max-w-5xl mx-auto w-full">
      
      {/* Dashboard Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {lang === 'ta' ? 'மாநகராட்சி வெப்ப மேலாண்மை: முதல் 10 ஆபத்தான பகுதிகள்' : 'GCC Municipal Heat Action: Top 10 High-Risk Wards'}
              </h2>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold px-2 py-0.5 rounded">
                CRITICAL ZONES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              {lang === 'ta' 
                ? 'அதிக வெயில், பாதசாரிகள் நெரிசல் மற்றும் குறைந்த மரங்கள் உள்ள பகுதிகள். அவசர குடிநீர் லாரி மற்றும் நிழல் கூடாரங்களை அமைக்கவும்.'
                : 'Ranked by heat index, pedestrian volume, and lack of shade canopy. Dispatch emergency drinking water tankers and cooling stations.'}
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">Water Tankers Deployed:</span>
          <span className="text-xs font-bold text-cyan-400 font-mono">{waterPoints.length}</span>
        </div>
      </div>

      {/* Dispatched Notification Banner */}
      {lastDispatched && (
        <div className="bg-emerald-950/60 border border-emerald-600/70 p-3 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-200 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>🚰 Emergency Water Tanker Deployed!</strong> Sent to Sector <strong>{lastDispatched.cell_id}</strong> ({lastDispatched.name || 'Commercial Hub'}).
            </span>
          </div>
          <button
            onClick={() => onSelectCell(lastDispatched)}
            className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] whitespace-nowrap transition-colors"
          >
            View on Map →
          </button>
        </div>
      )}

      {/* Ranked Vulnerability Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 text-center">Rank</th>
              <th className="py-2.5 px-3">Sector / Cell</th>
              <th className="py-2.5 px-3">Risk Score</th>
              <th className="py-2.5 px-3.5">Vulnerable Population</th>
              <th className="py-2.5 px-3.5">Required Municipal Intervention</th>
              <th className="py-2.5 px-3 text-center">Dispatch Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {data.map((item, idx) => {
              const isHigh = item.score >= 70;
              const hasWaterPoint = waterPoints.some(wp => wp.cell_id === item.cell_id);

              return (
                <tr 
                  key={item.cell_id}
                  className="hover:bg-slate-900/60 transition-colors"
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium">
                    #{idx + 1}
                  </td>

                  {/* Cell ID & Name */}
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    <div className="font-mono text-slate-300 font-bold">{item.cell_id}</div>
                    <div className="text-[10px] text-slate-400">{item.name || `Sector ${item.cell_id}`}</div>
                  </td>

                  {/* Score */}
                  <td className="py-2.5 px-3 font-semibold">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono ${
                      isHigh 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {item.score}/100
                    </span>
                  </td>

                  {/* Population note */}
                  <td className="py-2.5 px-3.5 text-slate-300 font-normal max-w-xs">
                    {item.population_note}
                  </td>

                  {/* Action Suggestion */}
                  <td className="py-2.5 px-3.5 text-slate-200 font-normal max-w-xs">
                    {item.suggestion}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View on map button */}
                      <button
                        onClick={() => onSelectCell(item)}
                        className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Locate cell on Map"
                        aria-label="Locate cell on Map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {/* Request / Deploy Water Tanker Button */}
                      <button
                        onClick={() => {
                          if (hasWaterPoint) {
                            onSelectCell(item);
                          } else {
                            handleWaterPointClick(item);
                          }
                        }}
                        className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all shadow-sm ${
                          hasWaterPoint
                            ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70'
                            : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                        }`}
                        title={hasWaterPoint ? "Click to view tanker on map" : "Request Municipal Water Tanker"}
                      >
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{hasWaterPoint ? '✅ Tanker Deployed' : 'Request Water Tanker'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

