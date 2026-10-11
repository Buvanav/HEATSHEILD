import React, { useState, useEffect } from 'react';
import { Navigation, Clock, ShieldCheck, Sparkles, MapPin, ExternalLink, Compass, Footprints, Camera, Volume2, VolumeX } from 'lucide-react';
import { translations } from '../i18n/translations';
import { speakText, stopSpeaking } from '../services/voiceService';

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
  const [showEmbeddedNav, setShowEmbeddedNav] = useState(false);
  const [isSpeakingDirections, setIsSpeakingDirections] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [routeData]);


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
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-400" />{tr.origin}</span>
            <span className="text-[10px] text-slate-400">Preset or Lat,Lon</span>
          </label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="e.g. 13.0410,80.2335"
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-1"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>-- Or pick landmark preset --</option>
            {PRESETS.map((p) => (
              <option key={p.coords} value={p.coords}>{p.name} ({p.coords})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" />{tr.destination}</span>
            <span className="text-[10px] text-slate-400">Preset or Lat,Lon</span>
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. 13.0090,80.2120"
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-1"
          />
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>-- Or pick landmark preset --</option>
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
            <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-600/70 flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="tree-sway-anim text-sm">🌳</span>
                  <span>{tr.coolest}</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-1 text-emerald-200 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-sm">{routeData.coolest.minutes}</span>
                <span className="text-[10px] text-emerald-400">{tr.minutes}</span>
              </div>
              <div className="text-[11px] text-emerald-300 mt-0.5">
                {tr.heatExposure}: <strong className="text-emerald-400">{routeData.coolest.exposure}/100</strong>
              </div>
              <div className="mt-1 pt-1 border-t border-emerald-800/60 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span>🍃 Continuous Tree Canopy Active</span>
              </div>
            </div>

          </div>

          {/* Turn-by-Turn Navigation Steps Panel */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                <span>Turn-by-Turn Shaded Directions</span>
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeakingDirections) {
                      stopSpeaking();
                      setIsSpeakingDirections(false);
                    } else {
                      setIsSpeakingDirections(true);
                      const speechText = lang === 'ta'
                        ? `குளிர்ந்த நிழல் பாதை தயார். பயண நேரம் ${routeData.coolest.minutes} நிமிடங்கள். ${routeData.exposure_reduction_pct} சதவீதம் குறைந்த வெப்ப அழுத்தம். படி ஒன்று: புறப்படும் இடத்தில் இருந்து மர நிழல் நோக்கி செல்லவும். படி இரண்டு: பனகல் பூங்கா மற்றும் நதிக்கரை நிழல் பாதையைப் பின்பற்றவும். படி மூன்று: பாதுகாப்பாக இலக்கை அடையுங்கள்.`
                        : `Coolest shaded route ready. Total walking time is ${routeData.coolest.minutes} minutes with ${routeData.exposure_reduction_pct} percent less heat stress. Step 1: Start at Origin and head towards tree canopy corridor. Step 2: Follow green shade corridor along Panagal Park. Step 3: Arrive safely at destination.`;
                      speakText(speechText, lang, () => setIsSpeakingDirections(false));
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition-colors ${
                    isSpeakingDirections
                      ? 'bg-rose-950/80 border-rose-700 text-rose-300 animate-pulse'
                      : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700/60 text-emerald-300'
                  }`}
                  title="Listen to Directions Aloud / வழிகளைக் குரலில் கேளுங்கள்"
                >
                  {isSpeakingDirections ? (
                    <>
                      <VolumeX className="w-3 h-3 text-rose-400" />
                      <span>{t.voice?.stopDirections || 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                      <span>{t.voice?.listenDirections || 'Listen'}</span>
                    </>
                  )}
                </button>

                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  {routeData.coolest.minutes} min walk
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-300 py-1">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0"></span>
                <div>
                  <strong className="text-slate-100 font-semibold block text-[11px]">1. Start at Origin</strong>
                  <span className="text-[11px] text-slate-400">Head toward nearest tree canopy & shade corridor</span>
                </div>
              </div>

              <div className="flex items-start gap-2 border-l border-emerald-800/60 pl-2.5 ml-1 my-0.5">
                <div>
                  <strong className="text-emerald-300 font-semibold block text-[11px]">2. Follow Green Shade Corridor</strong>
                  <span className="text-[11px] text-slate-400">Walk along Panagal Park / Adyar River cooling zone</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0"></span>
                <div>
                  <strong className="text-slate-100 font-semibold block text-[11px]">3. Arrive at Destination</strong>
                  <span className="text-[11px] text-slate-400">Destination reached with {routeData.exposure_reduction_pct}% lower heat exposure</span>
                </div>
              </div>
            </div>

            {/* Embedded Live Google Maps Turn-by-Turn Navigation Viewport */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowEmbeddedNav(!showEmbeddedNav)}
                  className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 hover:underline"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{showEmbeddedNav ? "Hide In-App Live Map Navigation" : "Show In-App Live Map Navigation"}</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <span>Open external tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {showEmbeddedNav && (
                <div className="w-full h-[260px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-inner">
                  <iframe
                    title="In-App Google Maps Turn-by-Turn Walking Navigation"
                    src={`https://maps.google.com/maps?saddr=${encodeURIComponent(from)}&daddr=${encodeURIComponent(to)}&dirflg=w&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen=""
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      )}



    </div>
  );
}

