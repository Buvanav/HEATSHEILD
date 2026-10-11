"""
backend/app/services/advice.py
Bedrock LLM safety advice generator with verified Tamil and English template fallbacks.
"""

import json
import logging
from typing import Dict, Any, Tuple
from app import config

logger = logging.getLogger("heatshield.advice")

# Verified Tamil and English Fallback Templates per Risk Band & Profile
TEMPLATES_EN = {
    "red": {
        "laborer": "Severe heat danger! Pause heavy physical labor and rest in shade every 20 minutes.",
        "vendor": "Very high temperature now. Stay under an umbrella or shade and drink hydrated water.",
        "elderly": "Extreme heat alert! Avoid stepping outdoors between 12 PM and 4 PM to prevent heat stroke.",
        "child": "Dangerous outdoor heat! Keep children indoors and encourage frequent hydration.",
        "office": "High heat conditions today. Avoid direct sun exposure during peak afternoon hours."
    },
    "amber": {
        "laborer": "Moderate heat risk. Drink water frequently and take short cooling breaks.",
        "vendor": "Warm weather today. Keep a water bottle ready and stay in shaded street spots.",
        "elderly": "Moderate outdoor heat. Wear light cotton clothing and carry an umbrella.",
        "child": "Warm afternoon. Ensure children wear caps and stay well hydrated.",
        "office": "Warm conditions outdoors. Stay hydrated when stepping out for lunch."
    },
    "green": {
        "laborer": "Comfortable weather conditions. Safe to carry out normal outdoor work.",
        "vendor": "Pleasant temperature today. Continue regular street vendor activities safely.",
        "elderly": "Normal outdoor temperature. Great time for a gentle shaded walk.",
        "child": "Pleasant weather. Safe for outdoor play and physical activity.",
        "office": "Mild weather conditions. Safe for commuting and outdoor activities."
    }
}

TEMPLATES_TA = {
    "red": {
        "laborer": "கடுமையான வெப்ப அபாயம்! பாரமான வேலைகளை நிறுத்தி 20 நிமிடங்களுக்கு ஒருமுறை நிழலில் ஓய்வெடுக்கவும்.",
        "vendor": "இப்போது கடுமையான வெப்பம்! நிழலான குடை அடியில் நின்று அடிக்கடி தண்ணீர் குடியுங்கள்.",
        "elderly": "அதிக வெப்ப எச்சரிக்கை! நண்பகல் 12 மணி முதல் 4 மணி வரை வெளியில் செல்வதை தவிர்க்கவும்.",
        "child": "கடுமையான வெயில் அபாயம்! குழந்தைகளை வெளியில் விளையாட விடாமல் வீட்டில் பாதுகாப்பாக வைக்கவும்.",
        "office": "இன்று அதிக வெப்பம் நிலவுகிறது. மதிய வேளையில் நேரடி வெயிலில் செல்வதை தவிர்க்கவும்."
    },
    "amber": {
        "laborer": "மிதமான வெப்பம். அடிக்கடி நீர் அருந்தி குறுகிய நேர ஓய்வு எடுக்கவும்.",
        "vendor": "இன்று வெப்பம் அதிகம். குடிநீர் பாட்டில் வைக்கோல் நிழலில் வியாபாரம் செய்யவும்.",
        "elderly": "மிதமான வெப்ப நிலை. பருத்தி ஆடைகளை அணிந்து குடை எடுத்துச் செல்லவும்.",
        "child": "வெப்பமான மதிய வேளை. குழந்தைகளுக்கு தொப்பி அணிவித்து தண்ணீர் கொடுக்கவும்.",
        "office": "வெளியில் மிதமான வெப்பம். உணவகத்திற்குச் செல்லும்போது போதுமான நீர் அருந்தவும்."
    },
    "green": {
        "laborer": "இதமான வானிலை. பாதுகாப்பாக உங்கள் வெளிப்புறப் பணிகளைத் தொடரலாம்.",
        "vendor": "இன்று நல்ல வானிலை. வழக்கமான வியாபாரப் பணிகளை மேற்கொள்ளலாம்.",
        "elderly": "இயல்பான வெப்பநிலை. பூங்காவில் நடைப்பயிற்சி செய்ய உகந்த நேரம்.",
        "child": "இதமான சூழல். குழந்தைகள் வெளியில் விளையாட பாதுகாப்பானது.",
        "office": "மிதமான வானிலை. வெளியில் செல்வதற்கு ஏற்ற சூழல்."
    }
}


def get_template_advice(band: str, profile: str, lang: str = "en") -> str:
    """
    Returns verified static safety template matching band, profile, and language.
    """
    profile_key = profile.lower() if profile.lower() in ("office", "vendor", "laborer", "elderly", "child") else "vendor"
    band_key = band.lower() if band.lower() in ("red", "amber", "green") else "amber"

    if lang.lower() == "ta":
        return TEMPLATES_TA.get(band_key, {}).get(profile_key, TEMPLATES_TA["amber"]["vendor"])
    else:
        return TEMPLATES_EN.get(band_key, {}).get(profile_key, TEMPLATES_EN["amber"]["vendor"])


async def generate_advice(score: float, band: str, profile: str, lang: str = "en") -> str:
    """
    Generates advice using Amazon Bedrock with fallback to static template.
    """
    # 1. First try Bedrock if credentials & config permit
    try:
        import boto3
        bedrock = boto3.client("bedrock-runtime", region_name=config.AWS_REGION)

        prompt = (
            f"Generate exactly 2 short, direct safety advice sentences for a person in Chennai. "
            f"Heat risk score: {score}/100 ({band} alert level). "
            f"Target profile: {profile}. "
            f"Language: {'Tamil' if lang.lower() == 'ta' else 'English'}. "
            f"Do not include introduction or preamble. Return only the two sentences."
        )

        model_id = config.BEDROCK_MODEL_ID

        # Use Bedrock Converse API (Universal support for Amazon Nova & Anthropic)
        try:
            response = bedrock.converse(
                modelId=model_id,
                messages=[
                    {"role": "user", "content": [{"text": prompt}]}
                ],
                inferenceConfig={"maxTokens": 150}
            )
            content_text = response["output"]["message"]["content"][0]["text"].strip()
            if content_text:
                logger.info(f"Successfully generated advice using AWS Bedrock ({model_id}).")
                return content_text
        except Exception as conv_err:
            logger.debug(f"Converse API call error: {conv_err}. Retrying with invoke_model...")
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 150,
                "messages": [{"role": "user", "content": prompt}]
            })
            response = bedrock.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body
            )
            response_body = json.loads(response.get("body").read())
            content_text = response_body.get("content", [{}])[0].get("text", "").strip()
            if content_text:
                return content_text


    except Exception as e:
        logger.debug(f"Bedrock invocation skipped or failed ({e}). Using template fallback.")

    # 2. Template fallback
    return get_template_advice(band, profile, lang)


async def get_dual_language_advice(score: float, band: str, profile: str) -> Tuple[str, str]:
    """
    Returns both English and Tamil advice strings.
    """
    adv_en = await generate_advice(score, band, profile, lang="en")
    adv_ta = await generate_advice(score, band, profile, lang="ta")
    return adv_en, adv_ta
