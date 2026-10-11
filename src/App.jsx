// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import TimeSlider from './components/TimeSlider';
import AdviceCard from './components/AdviceCard';
import RoutePanel from './components/RoutePanel';
import MunicipalTab from './components/MunicipalTab';
import LiveSensors from './components/LiveSensors';
import StreetViewModal from './components/StreetViewModal';
import VoiceModal from './components/VoiceModal';
import { setMuted } from './services/voiceService';
import { 

  getCells, 
  getRisk, 
  getRoute, 
  getMunicipalTop, 
  getSensors 
} from './api/api';
import { translations } from './i18n/translations';
import { AlertCircle, RefreshCw } from 'lucide-react';

const PROFILE_METRICS = {
  vendor: {
    title: 'Street Vendor',
    multiplier: '1.2×',
    badge: 'bg-amber-950/90 border-amber-600/60 text-amber-300',
    icon: '🛒',
    impact: '+20% Heat Stress Multiplier Active across all 100 cells',
    rule: 'Prolonged radiant asphalt exposure. Take mandatory 20-min shade rest every hour.'
  },
  laborer: {
    title: 'Physical Laborer',
    multiplier: '1.3×',
    badge: 'bg-orange-950/90 border-orange-600/60 text-orange-300',
    icon: '👷',
    impact: '+30% Heavy Exertion Penalty active across Chennai grid',
    rule: 'Dangerous metabolic heat buildup. Work stoppage advised during 12 PM - 3 PM.'
  },
  elderly: {
    title: 'Senior Citizen',
    multiplier: '1.4×',
    badge: 'bg-rose-950/90 border-rose-600/60 text-rose-300',
    icon: '❤️',
    impact: '+40% Clinical Heatstroke Risk (Highest Vulnerability Tier)',
    rule: 'Critical danger window: 11:30 AM - 3:30 PM. Remain in cool, ventilated indoor shade.'
  },
  child: {
    title: 'Child / Student',
    multiplier: '1.3×',
    badge: 'bg-purple-950/90 border-purple-600/60 text-purple-300',
    icon: '🎒',
    impact: '+30% Rapid Dehydration & High Solar Sensitivity',
    rule: 'Limit direct sun play between 12 PM and 4 PM. Frequent electrolyte hydration mandatory.'
  },
  office: {
    title: 'Office Worker',
    multiplier: '0.8×',
    badge: 'bg-blue-950/90 border-blue-600/60 text-blue-300',
    icon: '🏢',
    impact: '0.8× Indoor Climate-Controlled Baseline Profile',
    rule: 'Low indoor ambient risk. Commute and lunch transit caution advised.'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [lang, setLang] = useState('en');
  const [profile, setProfile] = useState('vendor');
  // Initialize directly to current real-world hour (clamped 6 AM to 8 PM)
  const [hour, setHour] = useState(() => {
    const currentH = new Date().getHours();
    return Math.max(6, Math.min(20, currentH));
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Data states
  const [cellsGeoJSON, setCellsGeoJSON] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [riskDetails, setRiskDetails] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [municipalData, setMunicipalData] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [waterPoints, setWaterPoints] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdviceOpen, setIsAdviceOpen] = useState(true);
  const [streetViewCell, setStreetViewCell] = useState(null);


  // 1. Fetch grid cells whenever hour or profile changes
  const fetchCellsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const geojson = await getCells(hour, profile);
      setCellsGeoJSON(geojson);

      // If a cell is currently selected, re-fetch risk details for it
      if (selectedCell) {
        const cellId = selectedCell.properties?.cell_id || selectedCell.cell_id;
        const matchingFeature = geojson.features.find(f => f.properties.cell_id === cellId);
        if (matchingFeature) {
          setSelectedCell(matchingFeature);
        }
      }
    } catch (err) {
      console.error("Failed to load cell grid data:", err);
      setError("Unable to connect to heat-risk data service. Displaying cached data.");
    } finally {
      setLoading(false);
    }
  }, [hour, profile, selectedCell]);

  useEffect(() => {
    fetchCellsData();
  }, [hour, profile]);

  // 2. Fetch Municipal Top 10 data on initial load
  useEffect(() => {
    async function loadMunicipal() {
      try {
        const top = await getMunicipalTop(10);
        setMunicipalData(top);
      } catch (err) {
        console.error("Failed to load municipal top data:", err);
      }
    }
    loadMunicipal();
  }, []);

  // 3. Live Sensors 5-second polling loop
  const fetchSensorsData = useCallback(async () => {
    try {
      const data = await getSensors();
      setSensors(data);
    } catch (err) {
      console.error("Failed to poll live sensors:", err);
    }
  }, []);

  useEffect(() => {
    fetchSensorsData();
    const interval = setInterval(fetchSensorsData, 5000);
    return () => clearInterval(interval);
  }, [fetchSensorsData]);

  // Handle cell click on map
  const handleCellClick = async (feature) => {
    setSelectedCell(feature);
    setIsAdviceOpen(true);

    try {
      const props = feature.properties;
      // Coordinates center of polygon feature
      const coords = feature.geometry.coordinates[0][0];
      const risk = await getRisk(coords[1], coords[0], profile, hour);
      setRiskDetails(risk);
    } catch (err) {
      console.error("Failed to get risk detail for cell:", err);
    }
  };

  // Handle Route Calculation
  const handleCalculateRoute = async (fromCoords, toCoords) => {
    try {
      setRouteLoading(true);
      setError(null);
      const res = await getRoute(fromCoords, toCoords, profile, hour);
      setRouteData(res);
    } catch (err) {
      console.error("Failed to calculate shade route:", err);
      setError("Failed to compute shade route. Please check coordinates.");
    } finally {
      setRouteLoading(false);
    }
  };

  // Handle Municipal Water Point / Tanker Request & Placement
  const handleAddWaterPoint = (cellItem) => {
    let lat = 13.0300;
    let lon = 80.2300;

    // 1. Calculate centroid from cellsGeoJSON feature polygon
    if (cellsGeoJSON?.features) {
      const match = cellsGeoJSON.features.find(f => f.properties?.cell_id === cellItem.cell_id);
      if (match?.geometry?.coordinates?.[0]) {
        const ring = match.geometry.coordinates[0];
        lon = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
        lat = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
      }
    } else {
      // 2. Mathematical grid fallback
      const match = cellItem.cell_id?.match(/r(\d+)c(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const c = parseInt(match[2]);
        lat = 13.0000 + (r + 0.5) * 0.0045;
        lon = 80.2000 + (c + 0.5) * 0.0046;
      }
    }

    const newWp = {
      id: `wp-${Date.now()}`,
      cell_id: cellItem.cell_id,
      name: cellItem.name || `Sector ${cellItem.cell_id}`,
      lat,
      lon
    };

    setWaterPoints((prev) => [
      ...prev.filter(p => p.cell_id !== cellItem.cell_id),
      newWp
    ]);
  };

  // Handle Municipal table row cell selection (locates and flies to cell on map)
  const handleSelectMunicipalCell = (cellItem) => {
    let targetFeature = null;
    if (cellsGeoJSON?.features) {
      targetFeature = cellsGeoJSON.features.find(f => f.properties?.cell_id === cellItem.cell_id);
    }
    setSelectedCell(targetFeature || cellItem);
    setIsAdviceOpen(true);
    setActiveTab('map');
  };

  // Handle Mute Toggle
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  };

  // Handle Voice Assistant Command Execution
  const handleExecuteVoiceCommand = async (cmd) => {
    if (!cmd) return;

    if (cmd.type === 'MUTE') {
      setIsMuted(cmd.muted);
      setMuted(cmd.muted);
    } else if (cmd.type === 'NAV_TAB') {
      setActiveTab(cmd.tab);
    } else if (cmd.type === 'OPEN_STREETVIEW') {
      setStreetViewCell(selectedCell || cellsGeoJSON?.features?.[0]);
    } else if (cmd.type === 'SET_HOUR') {
      setHour(cmd.hour);
    } else if (cmd.type === 'ROUTE') {
      setActiveTab('routes');
      handleCalculateRoute(cmd.from, cmd.to);
    } else if (cmd.type === 'INSPECT_LANDMARK') {
      setActiveTab('map');
      setIsAdviceOpen(true);
      const parts = cmd.landmark.coords.split(',');
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      try {
        const risk = await getRisk(lat, lon, profile, hour);
        setRiskDetails(risk);
        if (cellsGeoJSON?.features) {
          const matching = cellsGeoJSON.features.find(f => f.properties.cell_id === risk.cell_id);
          if (matching) setSelectedCell(matching);
        }
      } catch (e) {
        console.error('Failed to inspect landmark via voice:', e);
      }
    } else if (cmd.type === 'SHOW_WATER') {
      setActiveTab('map');
    } else if (cmd.type === 'PROFILE') {
      setProfile(cmd.profile);
    } else if (cmd.type === 'LANG') {
      setLang(cmd.lang);
    }
  };

  return (
    <div className={`min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans ${lang === 'ta' ? 'font-tamil' : ''}`}>
      
      {/* Header Navigation */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        profile={profile}
        setProfile={setProfile}
        onOpenVoice={() => setIsVoiceOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Error / Alert Banner */}
      {error && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-4 py-2 text-xs font-medium text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden p-3 sm:p-4 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: HEAT RISK MAP VIEW (Default) */}
        {activeTab === 'map' && (
          <div className="relative flex-1 w-full h-[calc(100vh-140px)] min-h-[500px] flex flex-col">
            
            {/* Map Canvas */}
            <div className="flex-1 w-full relative">
              <MapView 
                cellsGeoJSON={cellsGeoJSON}
                onCellClick={handleCellClick}
                selectedCell={selectedCell}
                routeData={routeData}
                sensors={sensors}
                waterPoints={waterPoints}
                lang={lang}
                hour={hour}
                onOpenStreetView={(cell) => setStreetViewCell(cell || selectedCell)}
              />

              {/* Floating Active Profile Impact Banner (Top Right) */}
              <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl shadow-xl max-w-xs">
                <div className={`p-1.5 rounded-lg border text-sm flex items-center justify-center min-w-[28px] ${PROFILE_METRICS[profile]?.badge || ''}`}>
                  {PROFILE_METRICS[profile]?.icon || '👤'}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{PROFILE_METRICS[profile]?.title || 'Persona'}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${PROFILE_METRICS[profile]?.badge || ''}`}>
                      {PROFILE_METRICS[profile]?.multiplier || '1.0×'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">
                    {PROFILE_METRICS[profile]?.impact || ''}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                    {PROFILE_METRICS[profile]?.rule || ''}
                  </span>
                </div>
              </div>

              {/* Floating Time Slider (Top Left / Overlay) */}
              <div className="absolute top-4 left-4 z-20 max-w-sm w-full pr-8">
                <TimeSlider 
                  hour={hour}
                  setHour={setHour}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  lang={lang}
                />
              </div>

              {/* Floating Advice Card Drawer (Bottom Right) */}
              {isAdviceOpen && (selectedCell || riskDetails) && (
                <div className="absolute bottom-4 right-4 z-20 max-w-sm w-full pl-8 sm:pl-0">
                  <AdviceCard 
                    cell={selectedCell}
                    riskDetails={riskDetails}
                    lang={lang}
                    profile={profile}
                    onClose={() => setIsAdviceOpen(false)}
                    onOpenStreetView={(cell) => setStreetViewCell(cell || selectedCell)}
                  />
                </div>
              )}


              {/* Loading Indicator Spinner */}
              {loading && (
                <div className="absolute top-4 right-16 z-20 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 flex items-center gap-2 shadow-md">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Grid Data...</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SHADE ROUTE NAVIGATION */}
        {activeTab === 'routes' && (
          <div className="flex-1 flex flex-col md:flex-row gap-4 items-start justify-center pt-2">
            <RoutePanel 
              onCalculateRoute={handleCalculateRoute}
              routeData={routeData}
              loading={routeLoading}
              lang={lang}
            />

            {/* Quick Map Preview Side Column */}
            <div className="w-full md:flex-1 h-[450px] md:h-[600px] relative rounded-xl overflow-hidden border border-slate-800">
              <MapView 
                cellsGeoJSON={cellsGeoJSON}
                onCellClick={handleCellClick}
                selectedCell={selectedCell}
                routeData={routeData}
                sensors={sensors}
                waterPoints={waterPoints}
                lang={lang}
                onOpenStreetView={(cell) => setStreetViewCell(cell || selectedCell)}
              />

            </div>
          </div>
        )}

        {/* TAB 3: MUNICIPAL DASHBOARD */}
        {activeTab === 'municipal' && (
          <div className="flex-1 pt-2">
            <MunicipalTab 
              data={municipalData}
              onSelectCell={handleSelectMunicipalCell}
              onAddWaterPoint={handleAddWaterPoint}
              waterPoints={waterPoints}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 4: LIVE MICRO-CLIMATE SENSORS */}
        {activeTab === 'sensors' && (
          <div className="flex-1 pt-2">
            <LiveSensors 
              sensors={sensors}
              onRefresh={fetchSensorsData}
              lang={lang}
            />
          </div>
        )}

        {/* Street View 360 Inspection Modal */}
        {streetViewCell && (
          <StreetViewModal 
            cell={streetViewCell}
            riskDetails={riskDetails}
            onClose={() => setStreetViewCell(null)}
            lang={lang}
          />
        )}

        {/* AI Voice Assistant Modal */}
        <VoiceModal 
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          lang={lang}
          setLang={setLang}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onExecuteCommand={handleExecuteVoiceCommand}
        />


      </main>


      {/* Footer Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-900 py-2.5 px-4 text-center text-xs text-slate-400 font-normal">
        <span>HeatShield Chennai • Hyperlocal Urban Climate Action • T. Nagar to Guindy (13.03°N, 80.23°E)</span>
      </footer>

    </div>
  );
}

