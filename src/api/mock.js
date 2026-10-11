// src/api/mock.js
import { translations } from '../i18n/translations';

// 5km x 5km bounding box around T. Nagar (NE) to Guindy (SW)
// Center: 13.03°N, 80.23°E
const MIN_LAT = 13.0075;
const MAX_LAT = 13.0525;
const MIN_LON = 80.2075;
const MAX_LON = 80.2525;

const ROWS = 10;
const COLS = 10;
const LAT_STEP = (MAX_LAT - MIN_LAT) / ROWS;
const LON_STEP = (MAX_LON - MIN_LON) / COLS;

// Profile vulnerability multipliers
const PROFILE_MULTIPLIERS = {
  vendor: 1.2,
  laborer: 1.3,
  elderly: 1.4,
  child: 1.3,
  office: 0.8,
};

// Artificial network delay (ms)
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculates diurnal heat factor from 6 AM (0.0) to 1 PM - 3 PM (1.0) to 8 PM (0.15)
 */
function getHourFactor(hour) {
  const h = Math.max(6, Math.min(20, hour));
  if (h <= 13) {
    // 6 AM (6) to 1 PM (13) -> 0 to 1
    return Math.sin(((h - 6) / 7) * (Math.PI / 2));
  } else {
    // 1 PM (13) to 8 PM (20) -> 1 to 0.15
    const phase = (h - 13) / 7;
    return 1 - phase * 0.85;
  }
}

/**
 * Calculates raw spatial base risk score (0-100)
 * T. Nagar (NE: high row, high col) = High Risk
 * Guindy (SW: low row, low col) = Low Risk
 */
function getBaseCellMetrics(r, c) {
  // Distance from North-East (T. Nagar area r=2, c=7) vs South-West (Guindy park r=8, c=2)
  const distTNagar = Math.sqrt(Math.pow(r - 2, 2) + Math.pow(c - 7, 2));
  const distGuindy = Math.sqrt(Math.pow(r - 8, 2) + Math.pow(c - 2, 2));
  
  // Normalized spatial score (0.2 to 0.95)
  const tNagarWeight = 1 / (distTNagar + 1);
  const guindyWeight = 1 / (distGuindy + 1);

  // Base heat index (°C)
  const baseTemp = 32 + tNagarWeight * 9 - guindyWeight * 5; // 30°C - 41°C base
  const greenery = Math.max(8, Math.min(85, Math.round(75 * guindyWeight * 1.8 + (10 - r) * 2)));
  const builtDensity = Math.max(15, Math.min(95, Math.round(85 * tNagarWeight * 2.2 + r * 2)));

  // Raw risk base score (0 to 85)
  const baseScore = Math.max(15, Math.min(90, Math.round((baseTemp - 28) * 6 + (builtDensity * 0.3) - (greenery * 0.25))));

  return { baseScore, baseTemp, greenery, builtDensity };
}

/**
 * Returns GeoJSON FeatureCollection of 100 grid cells
 */
export async function getCellsMock(hour = 13, profile = 'vendor') {
  await delay(120);
  const hourFactor = getHourFactor(hour);
  const multiplier = PROFILE_MULTIPLIERS[profile] || 1.0;

  const features = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cellId = `r${r}c${c}`;
      
      // Calculate coordinates (Row 0 is North, Row 9 is South)
      const latTop = MAX_LAT - r * LAT_STEP;
      const latBottom = MAX_LAT - (r + 1) * LAT_STEP;
      const lonLeft = MIN_LON + c * LON_STEP;
      const lonRight = MIN_LON + (c + 1) * LON_STEP;

      const { baseScore, baseTemp, greenery, builtDensity } = getBaseCellMetrics(r, c);

      // Score adjusted for hour and profile
      let finalScore = Math.round(baseScore * multiplier * (0.4 + 0.6 * hourFactor));
      finalScore = Math.max(5, Math.min(99, finalScore));

      let band = 'green';
      if (finalScore >= 70) band = 'red';
      else if (finalScore >= 40) band = 'amber';

      const heatIndex = (baseTemp + hourFactor * 5.5 + (multiplier - 1.0) * 2).toFixed(1);

      features.push({
        type: 'Feature',
        id: cellId,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lonLeft, latTop],
            [lonRight, latTop],
            [lonRight, latBottom],
            [lonLeft, latBottom],
            [lonLeft, latTop]
          ]]
        },
        properties: {
          cell_id: cellId,
          row: r,
          col: c,
          score: finalScore,
          band: band,
          heat_index: parseFloat(heatIndex),
          greenery: greenery,
          built_density: builtDensity,
        }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Returns risk breakdown for a specific coordinate
 */
export async function getRiskMock(lat, lon, profile = 'vendor', hour = 13) {
  await delay(80);
  // Find matching cell
  const r = Math.max(0, Math.min(ROWS - 1, Math.floor((MAX_LAT - lat) / LAT_STEP)));
  const c = Math.max(0, Math.min(COLS - 1, Math.floor((lon - MIN_LON) / LON_STEP)));
  const cellId = `r${r}c${c}`;

  const { baseScore } = getBaseCellMetrics(r, c);
  const hourFactor = getHourFactor(hour);
  const mult = PROFILE_MULTIPLIERS[profile] || 1.0;
  
  let score = Math.round(baseScore * mult * (0.4 + 0.6 * hourFactor));
  score = Math.max(5, Math.min(99, score));

  let band = 'green';
  if (score >= 70) band = 'red';
  else if (score >= 40) band = 'amber';

  const adviceEn = translations.en.advice[profile] || translations.en.advice.vendor;
  const adviceTa = translations.ta.advice[profile] || translations.ta.advice.vendor;

  return {
    cell_id: cellId,
    score: score,
    band: band,
    unsafe_window: {
      start: score > 65 ? "11:30 AM" : "01:00 PM",
      end: score > 65 ? "04:00 PM" : "03:00 PM"
    },
    advice_en: adviceEn,
    advice_ta: adviceTa
  };
}

/**
 * Returns fastest (direct) vs coolest (shaded) route comparison
 */
export async function getRouteMock(from, to, profile = 'vendor', hour = 13) {
  await delay(200);

  const [fromLat, fromLon] = from.split(',').map(Number);
  const [toLat, toLon] = to.split(',').map(Number);

  // Direct straight line polyline
  const fastestCoords = [
    [fromLon, fromLat],
    [fromLon + (toLon - fromLon) * 0.33, fromLat + (toLat - fromLat) * 0.33],
    [fromLon + (toLon - fromLon) * 0.66, fromLat + (toLat - fromLat) * 0.66],
    [toLon, toLat]
  ];

  // Curved shade path swinging towards greener/lower risk areas (towards South-West / parks)
  const midLat = (fromLat + toLat) / 2 - 0.006;
  const midLon = (fromLon + toLon) / 2 - 0.005;

  const coolestCoords = [
    [fromLon, fromLat],
    [fromLon + (toLon - fromLon) * 0.25 - 0.003, fromLat + (toLat - fromLat) * 0.25 - 0.004],
    [midLon, midLat],
    [fromLon + (toLon - fromLon) * 0.75 - 0.003, fromLat + (toLat - fromLat) * 0.75 - 0.003],
    [toLon, toLat]
  ];

  // Calculate distance & exposure
  const distKm = Math.sqrt(Math.pow(toLat - fromLat, 2) + Math.pow(toLon - fromLon, 2)) * 111;
  const fastestMins = Math.max(6, Math.round(distKm * 18));
  const coolestMins = Math.round(fastestMins * 1.15); // 15% longer walking time

  const mult = PROFILE_MULTIPLIERS[profile] || 1.0;
  const hFactor = getHourFactor(hour);
  
  const fastestExposure = Math.min(95, Math.round(78 * mult * (0.5 + 0.5 * hFactor)));
  const coolestExposure = Math.max(18, Math.round(fastestExposure * 0.68)); // 32% lower heat exposure
  const reductionPct = Math.round(((fastestExposure - coolestExposure) / fastestExposure) * 100);

  return {
    fastest: {
      geometry: {
        type: 'LineString',
        coordinates: fastestCoords
      },
      minutes: fastestMins,
      exposure: fastestExposure
    },
    coolest: {
      geometry: {
        type: 'LineString',
        coordinates: coolestCoords
      },
      minutes: coolestMins,
      exposure: coolestExposure
    },
    exposure_reduction_pct: reductionPct
  };
}

/**
 * Returns Top N most vulnerable grid cells for municipal action
 */
export async function getMunicipalTopMock(n = 10) {
  await delay(150);

  const notes = [
    "High density street vendor market with zero canopy cover",
    "Active construction zone & unshaded bus terminus",
    "High elderly population ratio near congested junction",
    "School zone with unshaded pedestrian walkways",
    "Densely built commercial hub with high asphalt heat retention",
    "Transit transfer node with high footfall & low tree cover",
    "Unshaded pavement informal settlements",
    "Heavy traffic intersection with elevated surface temp",
    "Open outdoor loading yard with metallic roofing",
    "Narrow residential alleys with poor air circulation"
  ];

  const suggestions = [
    "Deploy mobile misting fans & emergency drinking water kiosk",
    "Install temporary green shade nets & shade tarpaulins",
    "Set up cool-roof reflective coating on community halls",
    "Erect shaded bus shelter & green tree planter boxes",
    "Deploy hydrated ORS distribution center",
    "Establish municipal cooling center & medical triage post",
    "Distribute solar reflective umbrellas to informal vendors",
    "Schedule emergency water tanker spray during peak 1-3 PM",
    "Install cool pavement coating along pedestrian corridors",
    "Setup public water fountain with ice storage"
  ];

  const topCells = [];
  
  // Pick cells from T. Nagar & commercial hubs (Rows 1-4, Cols 5-8)
  const priorityCoords = [
    { r: 2, c: 7 }, { r: 1, c: 6 }, { r: 2, c: 6 }, { r: 3, c: 7 }, { r: 2, c: 8 },
    { r: 1, c: 7 }, { r: 3, c: 6 }, { r: 4, c: 7 }, { r: 3, c: 8 }, { r: 2, c: 5 }
  ];

  for (let i = 0; i < Math.min(n, priorityCoords.length); i++) {
    const { r, c } = priorityCoords[i];
    const cellId = `r${r}c${c}`;
    const { baseScore } = getBaseCellMetrics(r, c);

    topCells.push({
      cell_id: cellId,
      score: Math.min(98, baseScore + 12 - i * 2),
      population_note: notes[i],
      suggestion: suggestions[i],
      lat: MAX_LAT - (r + 0.5) * LAT_STEP,
      lon: MIN_LON + (c + 0.5) * LON_STEP,
    });
  }

  return topCells.sort((a, b) => b.score - a.score);
}

/**
 * Returns live IoT micro-climate sensor node readings
 */
export async function getSensorsMock() {
  await delay(100);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Fluctuate temperatures slightly around peak values
  const randOffset = () => (Math.random() * 0.8 - 0.4);

  return [
    {
      id: "sens-01",
      name: "T. Nagar Bus Stand Node",
      cell_id: "r2c7",
      lat: 13.0410,
      lon: 80.2335,
      temp: parseFloat((40.8 + randOffset()).toFixed(1)),
      humidity: "62%",
      updated_at: timeStr
    },
    {
      id: "sens-02",
      name: "Panagal Park Junction",
      cell_id: "r2c6",
      lat: 13.0400,
      lon: 80.2290,
      temp: parseFloat((38.4 + randOffset()).toFixed(1)),
      humidity: "68%",
      updated_at: timeStr
    },
    {
      id: "sens-03",
      name: "Saidapet Metro Station",
      cell_id: "r5c4",
      lat: 13.0245,
      lon: 80.2220,
      temp: parseFloat((39.2 + randOffset()).toFixed(1)),
      humidity: "64%",
      updated_at: timeStr
    },
    {
      id: "sens-04",
      name: "Guindy Industrial Estate",
      cell_id: "r7c2",
      lat: 13.0120,
      lon: 80.2130,
      temp: parseFloat((37.1 + randOffset()).toFixed(1)),
      humidity: "71%",
      updated_at: timeStr
    },
    {
      id: "sens-05",
      name: "Anna University Campus Gate",
      cell_id: "r7c5",
      lat: 13.0110,
      lon: 80.2360,
      temp: parseFloat((35.8 + randOffset()).toFixed(1)),
      humidity: "74%",
      updated_at: timeStr
    },
    {
      id: "sens-06",
      name: "Usman Road Market Central",
      cell_id: "r1c7",
      lat: 13.0450,
      lon: 80.2340,
      temp: parseFloat((41.5 + randOffset()).toFixed(1)), // Triggers alert (>40°C)
      humidity: "59%",
      updated_at: timeStr
    }
  ];
}

/**
 * Returns contextual 2-sentence advice for a cell and profile
 */
export async function getAdviceMock(cellId, profile = 'vendor', lang = 'en') {
  await delay(50);
  const dict = translations[lang] || translations.en;
  return dict.advice[profile] || dict.advice.vendor;
}
