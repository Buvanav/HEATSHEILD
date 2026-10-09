// src/components/Header.jsx
import React from 'react';
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
  Building
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
  setProfile 
}) {
  const t = translations[lang] || translations.en;

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
              <p className="text-xs text-slate-400 font-normal">
                {t.subTitle} (T. Nagar - Guindy)
              </p>
            </div>
          </div>

          {/* Language Toggle for Mobile */}
          <div className="flex md:hidden items-center gap-1.5">
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

