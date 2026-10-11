# HeatShield Chennai API Contract

Base URL (Production): `https://<api-id>.execute-api.ap-south-1.amazonaws.com`  
Base URL (Local): `http://localhost:8000`

---

## 1. Health Check
`GET /health`

**Response 200 OK:**
```json
{
  "status": "ok"
}
```

---

## 2. Cell Grid with Risk Scores
`GET /cells?hour={0-23}&profile={office|vendor|laborer|elderly|child}`

Returns a GeoJSON `FeatureCollection` containing 100 grid cells (500m x 500m covering T. Nagar to Guindy).

**Query Parameters:**
- `hour` (optional, default: current UTC/IST hour 0-23): Target hour of day.
- `profile` (optional, default: `vendor`): Vulnerability profile (`office`, `vendor`, `laborer`, `elderly`, `child`).

**Response 200 OK:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [80.2200, 13.0300],
            [80.2245, 13.0300],
            [80.2245, 13.0345],
            [80.2200, 13.0345],
            [80.2200, 13.0300]
          ]
        ]
      },
      "properties": {
        "cell_id": "r4c6",
        "row": 4,
        "col": 6,
        "score": 82,
        "band": "red",
        "heat_index": 38.5,
        "greenery": 0.15,
        "built_density": 0.85,
        "name": "T. Nagar Ranganathan St"
      }
    }
  ]
}
```

---

## 3. Location Risk Assessment
`GET /risk?lat={latitude}&lon={longitude}&profile={profile}&hour={0-23}`

**Query Parameters:**
- `lat` (required, float): e.g. `13.0405`
- `lon` (required, float): e.g. `80.2335`
- `profile` (optional, default: `vendor`): `office` | `vendor` | `laborer` | `elderly` | `child`
- `hour` (optional, default: current hour 0-23)

**Response 200 OK:**
```json
{
  "cell_id": "r4c6",
  "score": 82,
  "band": "red",
  "unsafe_window": {
    "start": "12:00",
    "end": "16:00"
  },
  "advice_en": "Very hot now. Rest in shade and drink water.",
  "advice_ta": "இப்போது வெப்பம் அதிகம். நிழலில் ஓய்வெடுங்கள், தண்ணீர் குடியுங்கள்."
}
```

---

## 4. Cool Walking Route Recommender
`GET /route?from={lat,lon}&to={lat,lon}&profile={profile}&hour={0-23}`

**Query Parameters:**
- `from` (required, string): `lat,lon` e.g. `13.0410,80.2330`
- `to` (required, string): `lat,lon` e.g. `13.0210,80.2210`
- `profile` (optional, default: `vendor`)
- `hour` (optional, default: current hour)

**Response 200 OK:**
```json
{
  "fastest": {
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [80.2330, 13.0410],
        [80.2270, 13.0310],
        [80.2210, 13.0210]
      ]
    },
    "minutes": 18.5,
    "exposure": 74.2
  },
  "coolest": {
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [80.2330, 13.0410],
        [80.2290, 13.0360],
        [80.2240, 13.0260],
        [80.2210, 13.0210]
      ]
    },
    "minutes": 21.0,
    "exposure": 48.6
  },
  "exposure_reduction_pct": 34.5
}
```

---

## 5. Municipal High-Risk Rankings
`GET /municipal/top?n={limit}`

**Query Parameters:**
- `n` (optional, default: 10): Number of vulnerable cells to return.

**Response 200 OK:**
```json
[
  {
    "cell_id": "r4c6",
    "score": 88,
    "band": "red",
    "name": "T. Nagar Ranganathan St",
    "population_note": "Dense commercial foot traffic, street vendors without shade.",
    "suggestion": "Deploy mist cooling fan, distribute hydration packs, open Panagal Park shelter."
  }
]
```

---

## 6. Sensors Reading List
`GET /sensors`

**Response 200 OK:**
```json
[
  {
    "cell_id": "r4c6",
    "lat": 13.0405,
    "lon": 80.2335,
    "temp": 41.2,
    "humidity": 68.0,
    "updated_at": "2026-10-09T14:30:00Z"
  }
]
```

---

## 7. Submit Sensor Reading
`POST /sensor`

**Request Body:**
```json
{
  "cell_id": "r4c6",
  "temp": 41.2,
  "humidity": 68.0
}
```

**Response 200 OK:**
```json
{
  "status": "success",
  "cell_id": "r4c6",
  "updated_at": "2026-10-09T14:30:00Z"
}
```

---

## 8. Generate Safety Advice
`POST /advice`

**Request Body:**
```json
{
  "cell_id": "r4c6",
  "profile": "laborer",
  "lang": "ta"
}
```

**Response 200 OK:**
```json
{
  "cell_id": "r4c6",
  "profile": "laborer",
  "lang": "ta",
  "advice": "கடுமையான வெப்பம்! நிழலான இடத்தில் 15 நிமிடங்கள் ஓய்வெடுத்து நீர் அருந்தவும்."
}
```

---

## Error Handling
Standard HTTP Status Codes:
- `400 Bad Request`: Missing or invalid parameter
- `404 Not Found`: Cell or route location out of grid bounds
- `500 Internal Server Error`: Internal runtime failure

**Error Body:**
```json
{
  "error": "Invalid profile 'unknown'. Allowed profiles: office, vendor, laborer, elderly, child"
}
```
