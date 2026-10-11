// src/api/api.js
import {
  getCellsMock,
  getRiskMock,
  getRouteMock,
  getMunicipalTopMock,
  getSensorsMock,
  getAdviceMock,
} from './mock.js';

import {
  getCellsClient,
  getRiskClient,
  getRouteClient,
  getMunicipalTopClient,
  getSensorsClient,
  getAdviceClient,
} from './client.js';

// Environment check: VITE_USE_MOCK === 'true' or true string
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const isMockMode = USE_MOCK;

/**
 * Fetch 10x10 Grid GeoJSON cells for specified hour and profile
 */
export async function getCells(hour = 13, profile = 'vendor') {
  if (USE_MOCK) {
    return getCellsMock(hour, profile);
  }
  return getCellsClient(hour, profile);
}

/**
 * Fetch risk detail assessment for a lat, lon coordinate
 */
export async function getRisk(lat, lon, profile = 'vendor', hour = 13) {
  if (USE_MOCK) {
    return getRiskMock(lat, lon, profile, hour);
  }
  return getRiskClient(lat, lon, profile, hour);
}

/**
 * Fetch fastest vs coolest route calculation
 */
export async function getRoute(from, to, profile = 'vendor', hour = 13) {
  if (USE_MOCK) {
    return getRouteMock(from, to, profile, hour);
  }
  return getRouteClient(from, to, profile, hour);
}

/**
 * Fetch top N municipal vulnerable grid cells
 */
export async function getMunicipalTop(n = 10) {
  if (USE_MOCK) {
    return getMunicipalTopMock(n);
  }
  return getMunicipalTopClient(n);
}

/**
 * Fetch live micro-climate IoT sensor node readings
 */
export async function getSensors() {
  if (USE_MOCK) {
    return getSensorsMock();
  }
  return getSensorsClient();
}

/**
 * Fetch 2-sentence advice for a grid cell
 */
export async function getAdvice(cellId, profile = 'vendor', lang = 'en') {
  if (USE_MOCK) {
    return getAdviceMock(cellId, profile, lang);
  }
  return getAdviceClient(cellId, profile, lang);
}
