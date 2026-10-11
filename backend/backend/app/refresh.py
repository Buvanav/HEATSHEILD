"""
backend/app/refresh.py
Re-export handler from backend/refresh.py for SAM template compatibility.
"""
from refresh import handler, run_refresh

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_refresh())
