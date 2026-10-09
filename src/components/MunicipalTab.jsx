// src/components/MunicipalTab.jsx
import React, { useState } from 'react';
import { Building2, Droplets, MapPin } from 'lucide-react';
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

  const [addedCells, setAddedCells] = useState(new Set());

  const handleWaterPointClick = (cell) => {
    onAddWaterPoint(cell);
    setAddedCells(prev => new Set(prev).add(cell.cell_id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl text-slate-100 flex flex-col gap-4 max-w-4xl mx-auto w-full">
      
      {/* Dashboard Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{tm.title}</h2>
            <p className="text-xs text-slate-400 font-normal">{tm.subtitle}</p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">{tm.placedCount}:</span>
          <span className="text-xs font-bold text-cyan-400 font-mono">{waterPoints.length}</span>
        </div>
      </div>

      {/* Ranked Vulnerability Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 text-center">Rank</th>
              <th className="py-2.5 px-3">{tm.cellId}</th>
              <th className="py-2.5 px-3">{tm.score}</th>
              <th className="py-2.5 px-3.5">{tm.vulnerability}</th>
              <th className="py-2.5 px-3.5">{tm.suggestion}</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {data.map((item, idx) => {
              const isHigh = item.score >= 70;
              const hasWaterPoint = addedCells.has(item.cell_id) || waterPoints.some(wp => wp.cell_id === item.cell_id);

              return (
                <tr 
                  key={item.cell_id}
                  className="hover:bg-slate-900/60 transition-colors"
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium">
                    #{idx + 1}
                  </td>

                  {/* Cell ID */}
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                    {item.cell_id}
                  </td>

                  {/* Score */}
                  <td className="py-2.5 px-3 font-semibold">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
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
                        title={tm.viewOnMap}
                        aria-label={tm.viewOnMap}
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {/* Water Point Button */}
                      <button
                        onClick={() => handleWaterPointClick(item)}
                        disabled={hasWaterPoint}
                        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                          hasWaterPoint
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                            : 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-sm'
                        }`}
                      >
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{hasWaterPoint ? 'Water Point Placed' : tm.suggestWater}</span>
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

