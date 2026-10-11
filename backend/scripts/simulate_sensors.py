"""
scripts/simulate_sensors.py
IoT Sensor Simulator script for HeatShield Chennai.
Posts simulated temperature and humidity readings to the HeatShield API.

CLI Usage:
  python scripts/simulate_sensors.py --api http://localhost:8000 --interval 5
  python scripts/simulate_sensors.py --api http://localhost:8000 --spike r4c6
  python scripts/simulate_sensors.py --once
"""

import argparse
import time
import random
import httpx


def run_simulator(api_url: str, interval: float, spike_cell: str | None, once: bool):
    api_endpoint = f"{api_url.rstrip('/')}/sensor"
    print(f"Starting HeatShield IoT Sensor Simulator targetting {api_endpoint}")
    if spike_cell:
        print(f"--> DEMO SPIKE ACTIVE: Injecting +6.0°C temperature anomaly into cell {spike_cell}!")

    cycle = 0
    while True:
        cycle += 1
        print(f"\n[Cycle #{cycle}] Generating simulated sensor telemetry...")

        # Select 10 random cells to report in this telemetry burst
        sample_rows = [0, 1, 2, 4, 5, 7, 8, 9]
        sample_cols = [1, 2, 4, 5, 6, 8]
        selected_cells = [f"r{r}c{c}" for r in sample_rows for c in sample_cols]

        if spike_cell and spike_cell not in selected_cells:
            selected_cells.append(spike_cell)

        posted_count = 0
        for cell_id in selected_cells:
            base_temp = 36.0 + random.uniform(-1.5, 2.0)
            base_humidity = 64.0 + random.uniform(-5.0, 5.0)

            # Apply anomaly spike if flag active
            if spike_cell and cell_id == spike_cell:
                base_temp += 6.0
                base_humidity -= 8.0

            payload = {
                "cell_id": cell_id,
                "temp": round(base_temp, 1),
                "humidity": round(base_humidity, 1)
            }

            try:
                resp = httpx.post(api_endpoint, json=payload, timeout=3.0)
                if resp.status_code == 200:
                    posted_count += 1
                else:
                    print(f"  [ERROR] {cell_id} HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"  [FAIL] Failed to post telemetry for {cell_id}: {e}")

        print(f"  Successfully posted {posted_count}/{len(selected_cells)} sensor readings.")

        if once:
            break

        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="HeatShield Chennai IoT Sensor Simulator")
    parser.add_argument("--api", default="http://localhost:8000", help="Base URL of HeatShield API")
    parser.add_argument("--interval", type=float, default=5.0, help="Interval in seconds between telemetry cycles")
    parser.add_argument("--spike", default=None, help="Cell ID to inject +6.0°C temperature spike (e.g. r4c6)")
    parser.add_argument("--once", action="store_true", help="Run a single simulation cycle and exit")

    args = parser.parse_args()
    run_simulator(args.api, args.interval, args.spike, args.once)


if __name__ == "__main__":
    main()
