"""
scripts/seed_dynamodb.py
DynamoDB seeding script for HeatShield Chennai.
Populates sensor_readings and cell_scores DynamoDB tables with initial 24-hour heat score data.
"""

import sys
import os
import asyncio

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from refresh import run_refresh


def main():
    print("Starting HeatShield DynamoDB Data Seeding...")
    result = asyncio.run(run_refresh())
    print("\nSeeding summary:")
    print(f"  Records updated : {result.get('records_updated')}")
    print(f"  High risk cells : {result.get('high_risk_count')}")
    print(f"  Alert triggered : {result.get('alert_sent')}")
    print("\nDynamoDB seed complete!")


if __name__ == "__main__":
    main()
