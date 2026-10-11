from datetime import datetime, timezone, timedelta
import logging
from typing import List, Dict, Any, Optional
from app import config

logger = logging.getLogger("heatshield.alerts")


def get_current_ist_time() -> str:
    """Returns formatted current Indian Standard Time (IST = UTC + 5:30)."""
    utc_now = datetime.now(timezone.utc)
    ist_time = utc_now + timedelta(hours=5, minutes=30)
    return ist_time.strftime("%I:%M %p IST (%d-%b-%Y)")


def publish_heat_alert(
    high_risk_cells: List[Dict[str, Any]], 
    current_temp: float = 39.5, 
    heat_index: float = 43.2
) -> bool:
    """
    Publishes comprehensive SNS notification for critical heat risk cells
    including exact current time (IST), current temperature, felt heat index,
    and civic cooling precautions.
    """
    if not high_risk_cells:
        return False

    threshold = config.ALERT_THRESHOLD
    ist_timestamp = get_current_ist_time()

    top_sectors = high_risk_cells[:5]
    sector_lines = "\n".join([
        f"  • {c.get('name', c.get('cell_id'))}: Risk Score {c.get('score', 80.0):.1f}/100"
        for c in top_sectors
    ])

    subject = f"🔥 HeatShield Chennai: Critical Heat Warning ({current_temp:.1f}°C) at {ist_timestamp}"

    message = (
        f"====================================================\n"
        f"🔥 HEATSHIELD CHENNAI - CRITICAL HEAT ALERT 🔥\n"
        f"====================================================\n\n"
        f"⏰ Alert Time: {ist_timestamp}\n"
        f"🌡️ Current Ambient Temperature: {current_temp:.1f}°C\n"
        f"☀️ Felt Heat Index: {heat_index:.1f}°C\n"
        f"🚨 Trigger Condition: Exceeded Critical Threshold ({threshold}+)\n\n"
        f"📍 HIGH RISK CHENNAI SECTORS:\n"
        f"{sector_lines}\n\n"
        f"🛡️ IMMEDIATE SAFETY ADVISORY:\n"
        f"1. Outdoor Workers & Street Vendors: Seek shade immediately. Take mandatory 15-minute breaks every hour.\n"
        f"2. Hydration: Drink water and ORS/electrolytes every 20 minutes before feeling thirsty.\n"
        f"3. High-Risk Citizens: Children, pregnant women, and elderly citizens should remain indoors in well-ventilated rooms.\n"
        f"4. Emergency Cooling: Nearest water kiosks and cooling shelters are highlighted on the live map.\n\n"
        f"🌐 Live Interactive Dashboard: https://d2lmxv59vmxpg4.cloudfront.net\n"
        f"===================================================="
    )

    topic_arn = config.SNS_TOPIC_ARN or "arn:aws:sns:ap-southeast-2:956614410298:heatshield-alerts"

    try:
        import boto3
        sns = boto3.client("sns", region_name=config.AWS_REGION)
        response = sns.publish(
            TopicArn=topic_arn,
            Subject=subject[:100],  # SNS Subject limit is 100 chars
            Message=message
        )
        logger.info(f"Published SNS heat alert with temp {current_temp}°C at {ist_timestamp}. MessageId: {response.get('MessageId')}")
        return True
    except Exception as e:
        logger.warning(f"Failed to publish SNS alert ({e}). Logged message: {message}")
        return False

