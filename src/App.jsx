// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import TimeSlider from './components/TimeSlider';
import AdviceCard from './components/AdviceCard';
import RoutePanel from './components/RoutePanel';
import MunicipalTab from './components/MunicipalTab';
import LiveSensors from './components/LiveSensors';
import { 
  getCells, 
  getRisk, 
  getRoute, 
  getMunicipalTop, 
  getSensors 
} from './api/api';
import { translations } from './i18n/translations';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [lang, setLang] = useState('en');
  const [profile, setProfile] = useState('vendor');
  const [hour, setHour] = useState(13); // Default 1:00 PM peak heat
  const [isPlaying, setIsPlaying] = useState(false);

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
      // Switch to map view to show route polylines
      setActiveTab('map');
    } catch (err) {
      console.error("Failed to calculate shade route:", err);
      setError("Failed to compute shade route. Please check coordinates.");
    } finally {
      setRouteLoading(false);
    }
  };

  // Handle Municipal Water Point Suggestion
  const handleAddWaterPoint = (cellItem) => {
    setWaterPoints((prev) => [
      ...prev,
      {
        id: `wp-${Date.now()}`,
        cell_id: cellItem.cell_id,
        lat: cellItem.lat,
        lon: cellItem.lon
      }
    ]);
  };

  // Handle Municipal table row cell selection
  const handleSelectMunicipalCell = (cellItem) => {
    setSelectedCell(cellItem);
    setActiveTab('map');
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
              />

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

      </main>

      {/* Footer Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-900 py-2.5 px-4 text-center text-xs text-slate-400 font-normal">
        <span>HeatShield Chennai • Hyperlocal Urban Climate Action • T. Nagar to Guindy (13.03°N, 80.23°E)</span>
      </footer>

    </div>
  );
}

