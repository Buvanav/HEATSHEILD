# HeatShield Chennai - Backend

Hyperlocal heat-risk API for a 5 km x 5 km area of Chennai (T. Nagar to Guindy), split into 100 grid cells of 500 m. It turns weather, greenery, building density, and IoT sensor readings into a heat-risk score per cell, recommends cooler walking routes, ranks the most vulnerable cells for city officials, and generates localized Tamil/English safety advice.

---

## 🏛️ Architecture

```
React Frontend (S3 + CloudFront) --\
                                  >--> API Gateway (HTTP API) --> Lambda (FastAPI via Mangum)
Sensor Simulator (script) -------/                                   |
                                                                     +--> DynamoDB  (live readings, cell scores)
EventBridge Scheduler (hourly) --------------------> Lambda ---------+--> S3        (grid, road graph, POIs)
                                                     (refresh)       +--> Open-Meteo (weather forecast)
                                                                     +--> Bedrock   (Tamil/English safety advice)
                                                                     +--> SNS       (SMS heat alerts)
```

| Component | Role | Why it earns its place |
| :--- | :--- | :--- |
| **API Gateway (HTTP API)** | Public HTTPS entry point & CORS handler | Pay per request, fast, zero server management |
| **Lambda (FastAPI + Mangum)** | Scoring, routing, municipal, advice endpoints | Runs only when invoked |
| **EventBridge Scheduler** | Hourly weather & risk score refresh | Fully event-driven background sync |
| **DynamoDB (on-demand)** | Live sensor readings & cell scores | Ultra-fast key-value reads, TTL auto-expiry |
| **S3 Data Bucket** | Grid GeoJSON, road graph pickle, POIs | Fast cold-start loading for static layers |
| **Bedrock** | LLM short advice in Tamil & English | Hyperlocal advice tailored for outdoor workers |
| **SNS** | SMS/push heat warning notifications | Critical alert delivery to outdoor workers |

---

## 📁 Repository Structure

```
heatshield-backend/
├── README.md                  # System overview and deployment guide
├── template.yaml              # AWS SAM Infrastructure-as-Code
├── samconfig.toml             # SAM deployment parameters
├── .env.example               # Environment variables template
├── docs/
│   └── api-contract.md        # API Contract specification
├── data/
│   ├── grid.geojson           # 100 cells (r0c0 to r9c9) with greenery & built density
│   ├── poi.json               # Parks, water points, cooling shelters, hospitals
│   └── road_graph.pkl         # NetworkX walking graph with edge heat weights
├── backend/
│   ├── requirements.txt       # Production dependencies
│   ├── refresh.py             # EventBridge hourly refresh handler
│   ├── app/
│   │   ├── main.py            # FastAPI entry point + Mangum handler
│   │   ├── config.py          # Environment settings
│   │   ├── models.py          # Pydantic request/response schemas
│   │   ├── routes/            # API Route handlers (cells, risk, route, municipal, sensors, advice)
│   │   └── services/          # Pure logic (scoring, weather, routing, store, advice, alerts)
│   └── tests/                 # Pytest test suite (scoring, routing, API endpoints)
└── scripts/
    ├── prep.py                # Local spatial data generator
    ├── simulate_sensors.py    # IoT telemetry simulator (--spike flag for demos)
    └── seed_dynamodb.py       # Seed database script
```

---

## 🚀 Quick Start (Local Development)

### 1. Set Up Environment & Install Dependencies
```bash
py -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
cp .env.example .env
```

### 2. Generate Data Layers (One-Time Setup)
```bash
py scripts/prep.py
```
Outputs `grid.geojson`, `poi.json`, and `road_graph.pkl` to `data/`.

### 3. Run FastAPI Backend Server
```bash
uvicorn app.main:app --reload --port 8000 --app-dir backend
```
Access OpenAPI Interactive Docs: `http://localhost:8000/docs`

### 4. Run Sensor Simulator (Demo Anomaly Spike)
```bash
# Normal telemetry posting
py scripts/simulate_sensors.py --api http://localhost:8000 --interval 5

# Inject +6.0°C temperature spike into cell r4c6
py scripts/simulate_sensors.py --api http://localhost:8000 --spike r4c6
```

### 5. Run Test Suite
```bash
py -m pytest backend/tests
```

---

## 🧮 Heat Score Formula (Pure Functions)

$$\text{base} = 100 \times \left( 0.40 \times \text{hi}_{\text{norm}} + 0.20 \times (1 - \text{greenery}) + 0.20 \times \text{built\_density} + 0.10 \times \text{anomaly}_{\text{norm}} + 0.10 \times \text{tod}_{\text{factor}} \right)$$

$$\text{score} = \text{clamp}(\text{base} \times \text{profile\_factor}, 0, 100)$$

- **Heat Index Norm**: Open-Meteo apparent temperature scaled 26°C - 48°C to [0, 1].
- **Profile Multipliers**: `office`: 0.8, `vendor`: 1.2, `laborer`: 1.3, `child`: 1.3, `elderly`: 1.4.
- **Risk Bands**: `0-33`: Green (Low), `34-66`: Amber (Moderate), `67-100`: Red (Severe).

---

## ☁️ Deployment (AWS SAM)

```bash
# Build SAM artifacts
sam build

# Deploy to AWS (ap-south-1)
sam deploy --guided

# Upload preprocessed data layers to S3 bucket
aws s3 cp data/ s3://<DATA_BUCKET_NAME>/ --recursive
```
