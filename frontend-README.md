# HeatShield Chennai ☀️🛡️

> **Hyperlocal 500m Heat-Risk Web Application for Chennai (T. Nagar to Guindy)**  
> *Built for 2-Day Hackathon • Frontend Only • Plug-and-Play Mock API Architecture*

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20TailwindCSS%20%7C%20MapLibreGL-amber)
![Area](https://img.shields.io/badge/Area-5km%20x%205km%20(T.%20Nagar%20--%20Guindy)-emerald)
![MockAPI](https://img.shields.io/badge/Demo%20Mode-VITE__USE__MOCK%3Dtrue-cyan)

---

## 📌 Project Overview

**HeatShield Chennai** is a hyperlocal micro-climate risk monitoring and shade navigation app designed to protect urban outdoor workers, street vendors, elderly residents, and children from extreme heat stress.

The application divides a **5km x 5km area around T. Nagar to Guindy (13.03°N, 80.23°E)** into a **10x10 (100 cells) 500m grid**. It computes real-time heat index scores (0–100), classifies cells into green/amber/red risk bands, calculates shade routes, ranks municipal priority zones, and monitors live IoT sensor streams.

---

## 🛠️ Technology Stack

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS (Dark Mode, Glassmorphism, Responsive down to 360px)
- **Map Engine**: MapLibre GL JS v4 (Free OpenStreetMap / CartoDB Voyager raster tiles, **No API keys required**)
- **Icons**: Lucide React
- **Typography**: Inter & Noto Sans Tamil (Google Fonts)
- **API Layer**: Dual-mode pluggable system (`src/api/mock.js` for standalone hackathon demo, `src/api/client.js` for production backend integration)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Run Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔄 Backend API Switcher

The application requires **zero backend, zero database, and zero AWS setup** to run out-of-the-box in mock mode.

To switch to a live backend API built by a teammate:

1. Open `.env` (or create from `.env.example`).
2. Change `VITE_USE_MOCK` from `true` to `false`:
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
3. Restart the dev server (`npm run dev`). Components call `src/api/api.js` abstraction and will automatically fetch live endpoints specified in [`docs/api-contract.md`](./docs/api-contract.md).

---

## 📋 Hackathon Demo Checklist

Use this step-by-step checklist during your demo presentation:

### 1. Heat Risk Map & Inspection (Default View)
- [ ] Observe the **100 grid cells** rendered over T. Nagar – Guindy in Green (Low), Amber (Moderate), and Red (High Risk).
- [ ] Click any grid cell (e.g. `r2c7` in T. Nagar) to open the **Cell Details Popup** displaying Heat Index (°C), Risk Score, Greenery %, Built Density %, and unsafe time window.
- [ ] Note the **Demo Mode Badge** in the top header.

### 2. Time Slider & Diurnal Simulation
- [ ] Drag the **Time Slider** from 6 AM to 8 PM.
- [ ] Click the **Play Button** to watch the map colors dynamically animate as heat peaks around 1:00 PM – 3:00 PM ("PEAK HEAT" indicator triggers).

### 3. Vulnerability Profiles
- [ ] Switch the **Profile Selector** in the header from *Office Worker* (0.8x multiplier) to *Elderly Person* (1.4x multiplier) or *Street Vendor* (1.2x).
- [ ] Observe the risk scores increase for vulnerable populations and advice card content update accordingly.

### 4. Bilingual Tamil / English Support
- [ ] Click the **English / தமிழ்** toggle button in the header.
- [ ] Verify all UI headers, profile labels, band names, and advice card recommendations translate seamlessly into Tamil rendered with `Noto Sans Tamil`.

### 5. Shade Route Navigation
- [ ] Switch to the **Cool Routes** tab in the header navigation.
- [ ] Select origin (*T. Nagar Bus Stand*) and destination (*Guindy Station*).
- [ ] Click **Calculate Coolest Route**.
- [ ] Inspect the map overlay comparing the **dashed grey Fastest Route** vs the **glowing blue Coolest (Shaded) Route**.
- [ ] Verify the **"X% Less Heat Exposure"** callout badge.

### 6. Municipal Action Dashboard
- [ ] Switch to the **Municipal Dashboard** tab.
- [ ] Review the ranked table of the **Top 10 Vulnerable Grid Cells** with specific action suggestions.
- [ ] Click **Suggest Water Point** for any cell to drop an animated Cyan Water Station marker on the map.

### 7. Live Micro-Climate Sensors
- [ ] Switch to the **Live Sensors** tab.
- [ ] Observe live temperature readings updating every 5 seconds.
- [ ] Note the **HIGH HEAT SPIKE ALERT** top banner when any sensor node exceeds 40°C.

---

## 📄 Deliverables Included

- `src/` : Full React codebase, Tailwind config, and MapLibre components
- `src/api/` : API abstraction, client, and comprehensive mock engine
- `docs/api-contract.md` : Backend API specification contract for your teammate
- `.env.example` : Template environment configuration
- `README.md` : Project documentation & demo checklist
