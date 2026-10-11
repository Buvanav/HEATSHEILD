# HeatShield Chennai - Backend API Contract Specification

This document defines the exact HTTP API contract between the **HeatShield Chennai** React frontend application and the backend service.

When `VITE_USE_MOCK=false`, the frontend calls `VITE_API_BASE_URL` using standard `fetch` HTTP GET requests.

---

## Base URL Configuration

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Endpoints Summary

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/cells` | `hour` (6-20), `profile` (string) | Returns 10x10 grid GeoJSON FeatureCollection with heat scores |
| `GET` | `/risk` | `lat` (float), `lon` (float), `profile` (string), `hour` (int) | Returns risk score, band, unsafe window, and advice for a coordinate |
| `GET` | `/route` | `from` (lat,lon), `to` (lat,lon), `profile` (string), `hour` (int) | Returns fastest vs coolest route LineStrings and exposure comparison |
| `GET` | `/municipal/top` | `n` (default 10) | Returns ranked top N vulnerable grid cells with suggestions |
| `GET` | `/sensors` | None | Returns real-time IoT micro-climate sensor readings |

---

## Detailed Endpoint Contracts

### 1. GET `/cells`

Returns GeoJSON `FeatureCollection` representing the 500m x 500m grid cells covering the 5km x 5km area around T. Nagar to Guindy (13.0075°N to 13.0525°N, 80.2075°E to 80.2525°E).

#### Request Query Parameters
- `hour` (integer, optional, default: `13`): Hour of day from `6` (6 AM) to `20` (8 PM).
- `profile` (string, optional, default: `'vendor'`): Demographic profile ID (`vendor`, `laborer`, `elderly`, `child`, `office`).

#### Response Schema (`application/json`)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "r2c7",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [80.2300, 13.0450],
            [80.2345, 13.0450],
            [80.2345, 13.0405],
            [80.2300, 13.0405],
            [80.2300, 13.0450]
          ]
        ]
      },
      "properties": {
        "cell_id": "r2c7",
        "score": 84,
        "band": "red",
        "heat_index": 41.2,
        "greenery": 12,
        "built_density": 92
      }
    }
  ]
}
```

- `score`: integer `0 - 100`
- `band`: `'green'` (<40), `'amber'` (40-69), or `'red'` (>=70)

---

### 2. GET `/risk`

Returns detailed heat-risk breakdown for a specific location.

#### Request Query Parameters
- `lat` (float, required): Latitude coordinate (e.g. `13.0410`).
- `lon` (float, required): Longitude coordinate (e.g. `80.2335`).
- `profile` (string, required): `vendor | laborer | elderly | child | office`
- `hour` (integer, required): Hour `6 - 20`

#### Response Schema (`application/json`)
```json
{
  "cell_id": "r2c7",
  "score": 84,
  "band": "red",
  "unsafe_window": {
    "start": "11:30 AM",
    "end": "03:30 PM"
  },
  "advice_en": "Avoid direct sun exposure between 12:00 PM and 3:30 PM. Use damp cooling cloths and set up shade umbrella immediately.",
  "advice_ta": "மதியம் 12:00 முதல் 3:30 மணி வரை நேரடி வெயிலைத் தவிர்க்கவும். ஈரமான துணியைப் பயன்படுத்தவும்."
}
```

---

### 3. GET `/route`

Computes fastest direct walking route vs heat-optimized coolest (shaded) route.

#### Request Query Parameters
- `from` (string, required): `lat,lon` (e.g. `13.0410,80.2335`)
- `to` (string, required): `lat,lon` (e.g. `13.0090,80.2120`)
- `profile` (string, optional)
- `hour` (integer, optional)

#### Response Schema (`application/json`)
```json
{
  "fastest": {
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [80.2335, 13.0410],
        [80.2225, 13.0250],
        [80.2120, 13.0090]
      ]
    },
    "minutes": 22,
    "exposure": 82
  },
  "coolest": {
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [80.2335, 13.0410],
        [80.2280, 13.0310],
        [80.2180, 13.0180],
        [80.2120, 13.0090]
      ]
    },
    "minutes": 25,
    "exposure": 54
  },
  "exposure_reduction_pct": 34
}
```

---

### 4. GET `/municipal/top`

Returns ranked list of top N most vulnerable grid cells requiring urgent municipal interventions.

#### Request Query Parameters
- `n` (integer, optional, default: `10`): Number of cells to return.

#### Response Schema (`application/json`)
```json
[
  {
    "cell_id": "r2c7",
    "score": 96,
    "population_note": "High density street vendor market with zero canopy cover",
    "suggestion": "Deploy mobile misting fans & emergency drinking water kiosk",
    "lat": 13.0410,
    "lon": 80.2335
  }
]
```

---

### 5. GET `/sensors`

Returns array of IoT micro-climate sensor nodes. The frontend polls this endpoint every 5 seconds.

#### Response Schema (`application/json`)
```json
[
  {
    "id": "sens-01",
    "name": "T. Nagar Bus Stand Node",
    "cell_id": "r2c7",
    "lat": 13.0410,
    "lon": 80.2335,
    "temp": 40.8,
    "humidity": "62%",
    "updated_at": "01:45:12 PM"
  }
]
```

---

## Risk Score Calculation Formula

Backend implementations should calculate score using:

$$\text{Score} = \min\left(100, \text{BaseTempRisk} \times \text{ProfileMultiplier} \times \text{HourFactor} + (0.3 \times \text{BuiltDensity}) - (0.25 \times \text{Greenery})\right)$$

**Profile Multipliers:**
- `office`: 0.8
- `vendor`: 1.2
- `laborer`: 1.3
- `child`: 1.3
- `elderly`: 1.4
