# HEATSHEILD

**Street-level heat-risk intelligence for the people who work outdoors.**

![Status](https://img.shields.io/badge/status-hackathon%20prototype-orange)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb)
![AWS](https://img.shields.io/badge/cloud-AWS%20serverless-232F3E)

HeatShield Chennai turns weather, vegetation, building density and sensor readings into a **block-level heat-risk score**, then translates it into practical advice: is it safe to work outside right now, and which way should I walk?

Built as a learning-focused hackathon prototype for a 5 km x 5 km area of Chennai (T. Nagar to Guindy).

---

## Table of contents

1. [The problem](#1-the-problem)
2. [Our solution](#2-our-solution)
3. [Features](#3-features)
4. [How it works](#4-how-it-works)
5. [Architecture](#5-architecture)
6. [Tech stack](#6-tech-stack)
7. [Repository structure](#7-repository-structure)
8. [Getting started](#8-getting-started)
9. [API overview](#9-api-overview)
10. [Deployment](#10-deployment)
11. [Demo walkthrough](#11-demo-walkthrough)
12. [Limitations and honesty notes](#12-limitations-and-honesty-notes)
13. [Roadmap](#13-roadmap)
14. [Team](#14-team)
15. [Contributing](#15-contributing)
16. [License](#16-license)
17. [Acknowledgements and data attribution](#17-acknowledgements-and-data-attribution)

---

## 1. The problem

Urban heat is a silent public-health problem, especially in dense, low-income neighbourhoods with few trees, tin roofs and little access to cooling. Street vendors, delivery and construction workers, elderly residents and children feel heat stress with no localized warning.

Existing weather apps show one city-wide temperature. That is too coarse to help someone decide whether to travel, work outside or look for shade. The gap is not just forecasting; it is **actionable, block-level heat risk tied to vulnerable people**.

Chennai adds a specific challenge: coastal **humidity** makes the "feels like" temperature far higher than the thermometer reading, so a useful tool must use the heat index, not just air temperature.

## 2. Our solution

A mobile-friendly web app and API that answer three questions:

1. **How dangerous is the heat right here, right now?** A colour-coded map (green, amber, red).
2. **Is it safe for me to work or go out?** Advice based on who you are, such as a vendor or an elderly person.
3. **Which way should I walk?** A cooler route using shade and water stops, not just the shortest path.

A second view for **municipal teams and NGOs** ranks the most vulnerable cells, so a new water point or shelter goes where it helps most.

## 3. Features

| Feature | Description |
|---|---|
| Neighbourhood heat map | 100 cells of 500 m, scored from live weather plus static geospatial layers |
| Time slider | Drag from 6 AM to 8 PM to see risk change through the day |
| Profile-based risk | Same cell, different risk for an office worker, vendor, laborer, elderly person or child |
| Unsafe-window alerts | Shows the hours to avoid for the selected profile |
| Cool-route navigation | Fastest vs coolest walking route with a heat-exposure comparison |
| Municipal view | Top 10 vulnerable cells and suggested cooling-point locations |
| Live sensors | Simulated sensor readings update the map and can trigger alerts |
| Tamil and English | Simple safety advice in both languages |

## 4. How it works

**Data inputs**

| Input | Source | Update rate |
|---|---|---|
| Temperature, humidity, apparent temperature | Open-Meteo API | Hourly |
| Vegetation (greenery) | Pre-processed satellite layer, or OSM parks as a proxy | Static |
| Building density, road network, cooling points | OpenStreetMap | Static |
| Sensor readings | Simulated by a script (real IoT sensors in a future pilot) | Seconds |

**Heat score** (transparent formula, no black-box ML):

```
base  = 100 * ( 0.40 * heat_index
              + 0.20 * (1 - greenery)
              + 0.20 * built_density
              + 0.10 * sensor_anomaly
              + 0.10 * time_of_day )

score = clamp(base * profile_factor, 0, 100)
```

Bands: 0-33 green, 34-66 amber, 67-100 red. Profile factors range from 0.8 (office) to 1.4 (elderly).

**Cool route**: edge cost is distance multiplied by a penalty from the heat score of the cells it crosses, reduced near parks and water points. Dijkstra finds the coolest path; plain distance finds the fastest. Both are compared by estimated heat exposure.

Full details are in [`backend/README.md`](backend/README.md).

## 5. Architecture

```
React app (S3 + CloudFront) --\
                               >--> API Gateway --> Lambda (FastAPI via Mangum)
Sensor simulator (script) ----/                          |
                                                         +--> DynamoDB   live readings, cell scores
EventBridge (hourly) ---------------------> Lambda ------+--> S3         grid, road graph, POIs
                                          (refresh)      +--> Open-Meteo weather (outside AWS)
                                                         +--> Bedrock    Tamil/English advice
                                                         +--> SNS        heat alerts
```

AWS services are used only where they solve a real need:

| Service | Why |
|---|---|
| S3 + CloudFront | Fast, cheap hosting for low-end phones |
| API Gateway + Lambda | Pay-per-use API, no servers |
| DynamoDB | Fast small writes for sensors and scores |
| EventBridge | Hourly refresh as the weather changes |
| Bedrock | Simple multilingual advice for low-literacy users |
| SNS | Alerts for workers who may not open an app |
| IoT Core | Not built; the real-world path for sensors after the prototype |

## 6. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, MapLibre GL JS |
| Backend | Python 3.12, FastAPI, Mangum, networkx, httpx |
| Cloud | AWS Lambda, API Gateway, DynamoDB, S3, CloudFront, EventBridge, SNS, Bedrock |
| Infrastructure | AWS SAM |
| Data prep | osmnx, geopandas (local, one-time) |
| Maps | OpenStreetMap tiles |

## 7. Repository structure

```
heatshield-chennai/
  README.md                 # this file
  docs/
    api-contract.md         # shared API shapes (frontend and backend agree on this)
    images/                 # screenshots and the architecture diagram
  frontend/                 # React app, see frontend/README.md
  backend/                  # FastAPI + AWS SAM, see backend/README.md
```

## 8. Getting started

### Prerequisites

- Python 3.12 and Node.js 20 or newer
- Git
- For the AWS part only: an AWS account, AWS CLI and SAM CLI (see [`backend/README.md`](backend/README.md))

### Run everything locally without AWS

```bash
git clone https://github.com/<your-username>/heatshield-chennai.git
cd heatshield-chennai
```

**Backend** (terminal 1):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r src/requirements.txt
cp .env.example .env               # keeps USE_MOCK_STORE=true
uvicorn app.main:app --reload --port 8000 --app-dir src
```

**Frontend** (terminal 2):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend starts in **demo mode** with built-in mock data. To use the backend instead, set these in `frontend/.env` and restart the dev server:

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
```

### Connect to real AWS

Follow the AWS setup and deployment sections in [`backend/README.md`](backend/README.md). Never commit access keys.

## 9. API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/cells?hour&profile` | Heat score for every grid cell |
| GET | `/risk?lat&lon&profile&hour` | Score, unsafe window and advice for a point |
| GET | `/route?from&to&profile&hour` | Fastest vs coolest route |
| GET | `/municipal/top?n` | Most vulnerable cells |
| GET | `/sensors` | Latest sensor readings |
| POST | `/sensor` | Submit a sensor reading |
| POST | `/advice` | Short advice text in Tamil or English |

Full request and response shapes: [`docs/api-contract.md`](docs/api-contract.md).

## 10. Deployment

- **Backend:** `sam build && sam deploy --guided` from `backend/`
- **Frontend:** `npm run build`, then upload `dist/` to an S3 bucket behind CloudFront
- Step-by-step instructions are in the folder READMEs.

Cost notes: the stack is serverless with on-demand billing, so idle cost is near zero. Keep a billing alert on, and stop the sensor simulator when you are not demoing.

## 11. Demo walkthrough

1. Show a normal weather app: one temperature for the whole city.
2. Show the HeatShield map: neighbouring areas have clearly different risk.
3. Pick "street vendor" and drag the time slider to see the unsafe window and a Tamil advice message.
4. Compare the fastest and coolest routes and the exposure difference.
5. Switch to the municipal tab: "Where should the next water point go?"
6. Run the sensor simulator with `--spike` to heat one cell and watch the alert appear.

_Screenshots: add images to `docs/images/` and link them here._

## 12. Limitations and honesty notes

- The score is **rule-based**, not machine learning, and the weights are chosen for demonstration, not clinically validated.
- Sensor data is **simulated** in this prototype.
- Vegetation and building layers are **pre-processed once**, not a live satellite pipeline.
- The demo covers **one 5 km area**; other areas need new prep data.
- Advice text is generated for general guidance and is **not medical advice**. Tamil text should be reviewed by a native speaker before real use.

## 13. Roadmap

- [ ] Real low-cost sensors through AWS IoT Core in a pilot ward
- [ ] Live satellite land-surface-temperature layer
- [ ] Calibrate weights against measured temperatures
- [ ] More cities through a configurable area setting
- [ ] Offline-friendly progressive web app
- [ ] SMS and WhatsApp alerts for outdoor workers
- [ ] Partnerships with municipal bodies, NGOs and employers for heat action plans

## 14. Team

| Name | Role |
|---|---|
| `<name>` | Frontend developer |
| `<name>` | Backend and AWS developer |

## 15. Contributing

1. Fork the repository and create a branch: `git checkout -b feature/my-change`
2. Keep the API contract in `docs/api-contract.md` in sync with any change to response shapes
3. Run the tests in `backend/tests/` and the frontend build before opening a pull request
4. Never commit secrets, `.env` files or AWS credentials

## 16. License

Choose a license before publishing (MIT is a common choice for hackathon projects) and add a `LICENSE` file at the repo root.

## 17. Acknowledgements and data attribution

- Weather data: [Open-Meteo](https://open-meteo.com/). Check their terms for attribution and usage limits.
- Map data and tiles: &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Follow the OSM tile usage policy and keep tile traffic light.
- Satellite imagery for vegetation: Copernicus Sentinel data, if you use it.
- Built with FastAPI, React, MapLibre GL JS, osmnx and networkx.
