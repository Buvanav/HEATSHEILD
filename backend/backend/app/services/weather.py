"""
backend/app/services/weather.py
Weather data provider for Chennai using Open-Meteo API with resilient offline fallbacks.
"""

import logging
from typing import Dict, List, Any
import httpx

logger = logging.getLogger("heatshield.weather")

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast?"
    "latitude=13.03&longitude=80.23"
    "&hourly=temperature_2m,relative_humidity_2m,apparent_temperature"
    "&forecast_days=1&timezone=Asia%2FKolkata"
)


def get_fallback_weather() -> List[Dict[str, Any]]:
    """
    Generates realistic 24-hour hourly weather forecast for Chennai.
    Peaks around 14:00 (38°C temp, 44°C apparent temp, high humidity).
    """
    hourly = []
    for h in range(24):
        # Diurnal temperature cycle peaking at 14:00
        if 6 <= h <= 18:
            temp = round(28.0 + 10.0 * (1.0 - abs(h - 14) / 8.0)**1.5, 1)
            humidity = round(75.0 - 25.0 * (1.0 - abs(h - 14) / 8.0), 1)
        else:
            temp = round(27.0 + random_flat(h), 1)
            humidity = round(78.0 + random_flat(h), 1)

        # Humidity in Chennai raises apparent temperature
        apparent_temp = round(temp + (humidity / 100.0) * 6.5, 1)

        hourly.append({
            "hour": h,
            "temp": temp,
            "humidity": humidity,
            "apparent_temp": apparent_temp
        })
    return hourly


def random_flat(hour: int) -> float:
    return ((hour * 7) % 5) * 0.2


async def fetch_weather_forecast() -> List[Dict[str, Any]]:
    """
    Fetches hourly weather forecast from Open-Meteo.
    Returns list of 24 hourly weather dictionaries.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(OPEN_METEO_URL)
            if resp.status_code == 200:
                data = resp.json()
                hourly_data = data.get("hourly", {})
                temps = hourly_data.get("temperature_2m", [])
                humids = hourly_data.get("relative_humidity_2m", [])
                app_temps = hourly_data.get("apparent_temperature", [])

                result = []
                for h in range(min(24, len(temps))):
                    result.append({
                        "hour": h,
                        "temp": float(temps[h]),
                        "humidity": float(humids[h]),
                        "apparent_temp": float(app_temps[h])
                    })
                if len(result) == 24:
                    logger.info("Successfully fetched live weather from Open-Meteo")
                    return result
    except Exception as e:
        logger.warning(f"Failed to fetch Open-Meteo weather ({e}). Using offline fallback weather.")

    return get_fallback_weather()
