// src/components/TimeSlider.jsx
import React, { useEffect } from 'react';
import { Play, Pause, Clock, Sun } from 'lucide-react';

export function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour < 10 ? '0' : ''}${displayHour}:00 ${period}`;
}

export default function TimeSlider({ hour, setHour, isPlaying, setIsPlaying, lang }) {
  // Handle auto play animation
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setHour((prev) => (prev >= 20 ? 6 : prev + 1));
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, setHour]);

  const isPeak = hour >= 12 && hour <= 15;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg text-slate-100 flex flex-col gap-2">
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
            {lang === 'ta' ? 'நேரம்' : 'Diurnal Time'}
          </span>
          <span className="text-xs font-semibold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
            {formatHour(hour)}
          </span>
        </div>

        {isPeak && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
            <Sun className="w-3 h-3" />
            <span>{lang === 'ta' ? 'உச்ச வெப்பம் (Peak)' : 'PEAK HEAT'}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Play / Pause Toggle Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors min-w-[32px] ${
            isPlaying
              ? 'bg-amber-600 text-white hover:bg-amber-500'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Play Time Animation'}
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Range Slider */}
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="6"
            max="20"
            step="1"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-normal px-0.5">
            <span>6 AM</span>
            <span>9 AM</span>
            <span>12 PM</span>
            <span>3 PM</span>
            <span>6 PM</span>
            <span>8 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

