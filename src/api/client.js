// src/api/client.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchJSON(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getCellsClient(hour, profile) {
  return fetchJSON('/cells', { hour, profile });
}

export async function getRiskClient(lat, lon, profile, hour) {
  return fetchJSON('/risk', { lat, lon, profile, hour });
}

export async function getRouteClient(from, to, profile, hour) {
  return fetchJSON('/route', { from, to, profile, hour });
}

export async function getMunicipalTopClient(n = 10) {
  return fetchJSON('/municipal/top', { n });
}

export async function getSensorsClient() {
  return fetchJSON('/sensors');
}

export async function getAdviceClient(cellId, profile, lang) {
  return fetchJSON('/advice', { cell_id: cellId, profile, lang });
}
