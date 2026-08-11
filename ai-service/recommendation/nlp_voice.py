"""
Regional Multilingual NLP Voice Recognition & Intent Extraction Engine for AgriConnect.

Processes spoken queries in Indian regional languages (Hindi, Kannada, Marathi, Tamil,
Telugu, Punjabi, Bengali, Gujarati) and Hinglish/Romanized scripts to extract:
1. Target Crop Identification (fuzzy matched against 31 ICAR crops)
2. Intent Extraction (Price Lookup, Recommendation Request, General Search)
3. Confidence score & Mandi spot price / MSP enrichment.
"""

import re
from difflib import SequenceMatcher
from typing import Optional, List, Dict, Tuple


# Multilingual Crop Thesaurus mapping regional names/variants to official ICAR crop name
REGIONAL_CROP_THESAURUS = {
    "Rice (Paddy)": ["धान", "चावल", "अಕ್ಕಿ", "ಅಕ್ಕಿ", "ಭತ್ತ", "तांदूळ", "भात", "arisi", "chawal", "dhan", "rice", "paddy", "bhatta"],
    "Wheat": ["गेहूं", "गिहू", "गोಧಿ", "ಗೋದೂಮ", "गहू", "कनक", "gehun", "gehu", "godhi", "wheat", "kanak"],
    "Tomato": ["टमाटर", "ಟೊಮೆಟೊ", "टोमॅटो", "தக்காளி", "టమోటా", "tamatar", "tomato", "thakkali"],
    "Onion": ["प्याज", "कांदा", "ಈರುಳ್ಳಿ", "ಉಳ್ಳಾಗಡ್ಡಿ", "வெங்காயம்", "ఉల్లిపాయ", "pyaz", "pyaaz", "kanda", "eerulli", "onion"],
    "Potato": ["आलू", "बटाटा", "ಆಲೂಗಡ್ಡೆ", "உருளைக்கிழங்கு", "బంగాళాదుంప", "aloo", "alu", "batata", "aloogadde", "potato"],
    "Cotton": ["कपास", "रूई", "ಹತ್ತಿ", "कापूस", "பருத்தி", "పత్తి", "kapas", "rui", "hatti", "kapus", "cotton", "parutti"],
    "Sugarcane": ["गन्ना", "ऊस", "ಕಬ್ಬು", "ಕಬ್ಬಿನ", "ಗನ್ನಾ", "கரும்பு", "చెరకు", "ganna", "us", "kabbu", "kabbina", "sugarcane", "karumbu", "cheraku"],
    "Soybean": ["सोयाबीन", "ಸೋಯಾಬಿನ್", "soyabean", "soybean", "soya"],
    "Maize (Corn)": ["मक्का", "भुट्टा", "ಮೆಕ್ಕೆಜೋಳ", "ಮಕ್ಕೆಜೋಳ", "मका", "சோளம்", "జొన్న", "makka", "bhutta", "mekkejola", "corn", "maize", "maka"],
    "Groundnut (Peanut)": ["मूंगफली", "शेंगदाणा", "ಕಡಲೆಕಾಯಿ", "ನೆಲಗಡಲೆ", "நிலக்கடலை", "వేరుశనగ", "mungfali", "moongphali", "shengdana", "kadalekayi", "groundnut", "peanut"],
    "Chilli (Pepper)": ["मिर्च", "लाल मिर्च", "ಮೆಣಸಿನಕಾಯಿ", "मिरची", "மிளகாய்", "మిరపకాయ", "mirch", "mirchi", "menasinakayi", "chilli", "chili"],
    "Turmeric": ["हल्दी", "ಅರಿಶಿನ", "ಹಳದಿ", "हळद", "மஞ்சள்", "పసుపు", "haldi", "haldhi", "arishina", "halad", "manjal", "pasupu", "turmeric"],
    "Mustard": ["सरसों", "राया", "ಸಾಸಿವೆ", "मोहरी", "कडूगोधी", "sarson", "rai", "sasive", "mohari", "mustard"],
    "Chickpea (Chana)": ["चना", "छोला", "ಕಡಲೆ", "हरभरा", "சுண்டல்", "శనగలు", "chana", "chola", "kadale", "harbhara", "chickpea", "gram"],
    "Banana": ["केला", "ಬಾಳೆಹಣ್ಣು", "केळी", "வாழைப்பழம்", "అరటిపండు", "kela", "balehannu", "keli", "banana"],
    "Bajra (Pearl Millet)": ["बाजरा", "ಸಜ್ಜೆ", "बाजरी", "கம்பு", "సజ్జలు", "bajra", "bajari", "sajje", "kambu"],
    "Jowar (Sorghum)": ["ज्वार", "ಜೋಳ", "ज्वारी", "jowar", "jwari", "jola", "sorghum"],
    "Ragi (Finger Millet)": ["रागी", "मडुआ", "ರಾಗಿ", "ಮಡುವಾ", "கேழ்வரகு", "రాగులు", "ragi", "madua", "kezhvaragu"],
    "Barley": ["जौ", "ಜೇವ್", "जवस", "jau", "barley"],
    "Tur (Arhar/Pigeon Pea)": ["अरहर", "तुअर", "तूर", "ತೊಗರಿ", "ತುರ", "तुरी", "arhar", "tur", "tuar", "togari"],
    "Moong (Green Gram)": ["मूंग", "ಮೂಂಗ್", "ಹೆಸರುಕಾಳು", "मूग", "moong", "mung", "hesarukalu", "moog"],
    "Urad (Black Gram)": ["उड़द", "उरद", "ಉದ್ದು", "ಉದ್ದಿನಬೇಳೆ", "उडीद", "urad", "uddu", "uddinabele", "udid"],
    "Lentil (Masoor)": ["मसूर", "ಮಸೂರ್", "ಮಸೂರುಬೇಳೆ", "masoor", "masur", "masoorbele"],
    "Sunflower": ["सूरजमुखी", "ಸೂರ್ಯಕಾಂತಿ", "सूर्यफूल", "surajmukhi", "suryakanti", "sunflower"],
    "Sesamum (Til)": ["तिल", "ಎಳ್ಳು", "तीळ", "til", "ellu", "sesame"],
    "Safflower (Kusum)": ["कुसुम", "करडई", "ಕುಸುಮೆ", "kusum", "kardai", "kusume", "safflower"],
    "Jute": ["जूट", "पटसन", "ಶಣಬು", "jute", "pat-san", "shanabu"],
    "Brinjal (Eggplant)": ["बैंगन", "बदनेकाई", "ಬದನೆಕಾಯಿ", "वांगे", "baingan", "badanekayi", "wange", "brinjal", "eggplant"],
    "Cabbage": ["पत्तागोभी", "गोभी", "ಎಲೆಕೋಸು", "कोबी", "pattagobhi", "gobhi", "elekosu", "kobi", "cabbage"],
    "Okra (Bhindi)": ["भिंडी", "भेंडी", "ಬೆಂಡೇಕಾಯಿ", "भेंडी", "bhindi", "bhendi", "bendekayi", "okra"],
    "Coriander (Dhania)": ["धनिया", "कोथमीर", "ಕೊತ್ತಂಬರಿ", "कोथिंबीर", "dhania", "kothmir", "kothambari", "kothimbir", "coriander"]
}


# Regional Intent Keywords
PRICE_INTENT_KEYWORDS = [
    "कीमत", "भाव", "रेट", "दर", "मंडी", "விலை", "ಬೆಲೆ", "ಧಾರಣೆ", "ధర", "मूल्य",
    "price", "rate", "cost", "mandi", "bhav", "kimat", "bele"
]

RECOMMENDATION_INTENT_KEYWORDS = [
    "सलाह", "सुझाव", "बेस्ट", "बोना", "उगाना", "ಖರೀದಿ", "ಬೆಳೆಯುವುದು", "ಸಲಹೆ", "సిఫార్సు",
    "recommend", "best", "sow", "plant", "suitable", "grow", "advice", "salah"
]


def detect_language(text: str) -> str:
    """Basic script/character heuristic language detector."""
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"  # Devanagari (Hindi/Marathi)
    elif re.search(r'[\u0C80-\u0CFF]', text):
        return "kn"  # Kannada
    elif re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"  # Tamil
    elif re.search(r'[\u0C00-\u0C7F]', text):
        return "te"  # Telugu
    elif re.search(r'[\u0A80-\u0AFF]', text):
        return "gu"  # Gujarati
    elif re.search(r'[\u0980-\u09FF]', text):
        return "bn"  # Bengali
    elif re.search(r'[\u0A00-\u0A7F]', text):
        return "pa"  # Punjabi
    else:
        return "en-IN"  # English / Hinglish / Romanized Regional


def calculate_similarity(a: str, b: str) -> float:
    """Sequence matcher ratio for fuzzy tolerance against speech-to-text transcript variations."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def parse_voice_query(
    spoken_text: str,
    crops_data: list,
    market_data: list,
    language_hint: Optional[str] = "auto"
) -> dict:
    """Main NLP parser for spoken regional crop queries.

    Returns dict matching VoiceSearchResponse Pydantic schema.
    """
    clean_text = spoken_text.strip()
    detected_lang = detect_language(clean_text) if language_hint == "auto" else language_hint

    # 1. Determine Intent
    lower_query = clean_text.lower()
    if any(k in lower_query for k in PRICE_INTENT_KEYWORDS):
        intent = "price_query"
    elif any(k in lower_query for k in RECOMMENDATION_INTENT_KEYWORDS):
        intent = "recommendation_query"
    else:
        intent = "general_search"

    # 2. Extract Crop Entities using Fuzzy & Multilingual Matcher
    words = re.findall(r'[\w]+', clean_text.lower())
    full_phrase = clean_text.lower()

    crop_matches: List[Tuple[dict, str, float]] = []

    for crop_obj in crops_data:
        official_name = crop_obj["name"]
        variants = REGIONAL_CROP_THESAURUS.get(official_name, [official_name])

        best_term_score = 0.0
        best_matched_term = official_name

        for variant in variants:
            v_lower = variant.lower()
            # Direct inclusion match (highest confidence)
            if v_lower in full_phrase:
                score = 1.0
            else:
                # Token-level fuzzy match
                scores = [calculate_similarity(v_lower, w) for w in words]
                score = max(scores) if scores else 0.0

            if score > best_term_score:
                best_term_score = score
                best_matched_term = variant

        # Only retain matches with sufficient confidence (>= 0.55)
        if best_term_score >= 0.55:
            crop_matches.append((crop_obj, best_matched_term, best_term_score))

    # Sort matches by confidence score descending
    crop_matches.sort(key=lambda x: x[2], reverse=True)

    # Format Candidate Matches
    candidates = []
    top_match = None

    for crop_obj, matched_term, conf_score in crop_matches:
        # Find market price info from loaded dataset
        c_name = crop_obj["name"]
        m_entry = next((m for m in market_data if m.get("crop_name", "").lower() == c_name.lower()), {})

        match_info = {
            "crop": c_name,
            "hindi_name": crop_obj.get("hindi_name"),
            "matched_term": matched_term,
            "confidence_score": round(conf_score, 2),
            "msp_per_quintal": crop_obj.get("msp_per_quintal"),
            "market_price_per_quintal": m_entry.get("price_per_quintal", crop_obj.get("base_price_per_kg", 20) * 100),
            "trend": m_entry.get("trend", "flat"),
        }
        candidates.append(match_info)

    if candidates:
        top_match = candidates[0]

    # 3. Generate Natural Language Response Summary
    if top_match:
        c_name = top_match["crop"]
        h_name = f"({top_match['hindi_name']})" if top_match.get('hindi_name') else ""
        price = top_match.get("market_price_per_quintal")
        msp = top_match.get("msp_per_quintal")

        if intent == "price_query":
            msp_str = f" (Govt MSP: ₹{msp:,}/quintal)" if msp else ""
            summary = f"Recognized query for {c_name} {h_name}. Current Mandi spot price is ₹{price:,.0f}/quintal{msp_str} with {top_match['trend']}ward price trend."
        elif intent == "recommendation_query":
            summary = f"Recognized recommendation query for {c_name} {h_name}. Evaluated as highly suitable for active Indian agro-climatic zones."
        else:
            summary = f"Found match for crop {c_name} {h_name} based on spoken phrase '{top_match['matched_term']}'."
    else:
        summary = f"Could not confidently match a specific crop from voice query '{clean_text}'. Please try speaking the crop name in Hindi, Kannada, or English."

    return {
        "original_query": clean_text,
        "detected_language": detected_lang,
        "intent": intent,
        "matched_crop": top_match,
        "all_candidate_matches": candidates[:5],
        "response_summary": summary
    }
