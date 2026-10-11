// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  MapPin, 
  Navigation, 
  Building2, 
  Radio, 
  Languages, 
  UserCheck, 
  Briefcase, 
  HardHat, 
  HeartHandshake, 
  GraduationCap, 
  Building,
  Mic,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';
import { translations } from '../i18n/translations';
import { isMockMode } from '../api/api';

const PROFILES = [
  { id: 'vendor', icon: Briefcase },
  { id: 'laborer', icon: HardHat },
  { id: 'elderly', icon: HeartHandshake },
  { id: 'child', icon: GraduationCap },
  { id: 'office', icon: Building },
];

export default function Header({ 
  activeTab, 
  setActiveTab, 
  lang, 
  setLang, 
  profile, 
  setProfile,
  onOpenVoice,
  isMuted,
  onToggleMute
}) {
  const t = translations[lang] || translations.en;
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const activeProfileObj = PROFILES.find(p => p.id === profile) || PROFILES[0];
  const ProfileIcon = activeProfileObj.icon;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Top Branding Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white font-sans">
                  {t.appTitle}
                </h1>
                {isMockMode ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    {t.demoBadge}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                    {t.liveBadge}
                  </span>
                )}
              </div>
              {/* Dynamic Live Time Status instead of static 500m wording */}
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono">{timeString} IST</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                  <ProfileIcon className="w-3 h-3 text-amber-400" />
                  <span>{t.profiles[profile]} Mode</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Quick Action Buttons */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className={`px-2 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={isMuted ? "Click to Unmute" : "Click to Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={onOpenVoice}
              className="px-2.5 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition-colors"
              aria-label="Open Voice Assistant"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ta' ? 'குரல்' : 'Voice'}</span>
            </button>

            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation & Profile Selector Controls */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3">
          
          {/* Main Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[34px] ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.tabs.map}</span>
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[34px] ${
                activeTab === 'routes'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{t.tabs.routes}</span>
            </button>

            <button
              onClick={() => setActiveTab('municipal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[34px] ${
                activeTab === 'municipal'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t.tabs.municipal}</span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap min-h-[34px] ${
                activeTab === 'sensors'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{t.tabs.sensors}</span>
            </button>
          </nav>

          {/* Demographic Profile Dropdown / Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs font-medium rounded-md pl-8 pr-7 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none transition-colors cursor-pointer min-h-[34px]"
              >
                {PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t.profiles[p.id]}
                  </option>
                ))}
              </select>
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400 text-[9px]">▼</div>
            </div>

            {/* Voice Assistant Trigger */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm active:scale-95 min-h-[34px] group"
              title="Open Voice Assistant / குரல் உதவி"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400 group-hover:animate-pulse" />
              <span className="font-semibold text-xs">{lang === 'ta' ? 'குரல் உதவி' : 'Voice AI'}</span>
            </button>

            {/* Universal Mute/Unmute Audio Toggle */}
            <button
              onClick={onToggleMute}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all shadow-sm active:scale-95 min-h-[34px] ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={isMuted ? "Audio Muted - Click to Unmute" : "Audio Active - Click to Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? (lang === 'ta' ? 'அமைதி' : 'Muted') : (lang === 'ta' ? 'ஒலி' : 'Sound')}</span>
            </button>

            {/* Desktop Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors min-h-[34px]"
              title="Switch Language / மொழியை மாற்றுக"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

