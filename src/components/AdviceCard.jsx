// src/components/AdviceCard.jsx
import React from 'react';
import { AlertTriangle, ShieldCheck, Thermometer, TreeDeciduous, Building, Clock, X } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function AdviceCard({ cell, riskDetails, lang, onClose, profile }) {
  if (!cell && !riskDetails) return null;

  const t = translations[lang] || translations.en;
  const band = cell?.properties?.band || riskDetails?.band || 'amber';
  const score = cell?.properties?.score ?? riskDetails?.score ?? 50;
  const cellId = cell?.properties?.cell_id || riskDetails?.cell_id || 'r0c0';
  
  const heatIndex = cell?.properties?.heat_index || '38.5';
  const greenery = cell?.properties?.greenery || 25;
  const builtDensity = cell?.properties?.built_density || 75;

  const bandStyles = {
    green: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/50',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-700 text-white',
      label: t.bands.green,
      icon: ShieldCheck
    },
    amber: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/50',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-600 text-white',
      label: t.bands.amber,
      icon: AlertTriangle
    },
    red: {
      bg: 'bg-rose-950/40',
      border: 'border-rose-700/50',
      text: 'text-rose-400',
      badgeBg: 'bg-rose-600 text-white',
      label: t.bands.red,
      icon: AlertTriangle
    }
  };

  const style = bandStyles[band] || bandStyles.amber;
  const BandIcon = style.icon;

  const adviceText = lang === 'ta'
    ? (riskDetails?.advice_ta || t.advice[profile] || t.advice.vendor)
    : (riskDetails?.advice_en || t.advice[profile] || t.advice.vendor);

  const unsafeWindow = riskDetails?.unsafe_window || { start: "11:30 AM", end: "03:30 PM" };

  return (
    <div className={`bg-slate-900 border ${style.border} rounded-xl p-4 shadow-xl text-slate-100 flex flex-col gap-3 relative transition-all`}>
      
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close card"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between pr-6">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${style.badgeBg}`}>
            {score}/100 • {style.label}
          </div>
          <span className="text-xs font-mono text-slate-400">
            {cellId}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>{t.mapScreen.heatIndex}</span>
          </div>
          <span className="font-semibold text-slate-100 text-xs mt-0.5">{heatIndex}°C</span>
        </div>

        <div className="flex flex-col items-center text-center border-x border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
            <TreeDeciduous className="w-3 h-3 text-emerald-400" />
            <span>{t.mapScreen.greenery}</span>
          </div>
          <span className="font-semibold text-slate-100 text-xs mt-0.5">{greenery}%</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
            <Building className="w-3 h-3 text-slate-400" />
            <span>{t.mapScreen.builtDensity}</span>
          </div>
          <span className="font-semibold text-slate-100 text-xs mt-0.5">{builtDensity}%</span>
        </div>
      </div>

      {/* Unsafe Time Window */}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-medium text-slate-300">{t.mapScreen.unsafeWindow}:</span>
          <span className="font-semibold text-amber-300 font-mono text-[11px]">
            {unsafeWindow.start} – {unsafeWindow.end}
          </span>
        </div>
      </div>

      {/* 2-Sentence Actionable Advice */}
      <div className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        <BandIcon className={`w-4 h-4 ${style.text} flex-shrink-0 mt-0.5`} />
        <p className="text-xs leading-relaxed text-slate-300 font-normal">
          {adviceText}
        </p>
      </div>

    </div>
  );
}

