from typing import Dict, List, Any


def build_reasoning(
    components: Dict[str, int],
    crop_name: str,
    season: str,
    weather: Dict[str, Any] = None,
    crop_info: Dict[str, Any] = None,
) -> List[str]:
    """Generate human-readable explanations backed by real meteorological & agronomic data."""
    points = []
    weather = weather or {}
    crop_info = crop_info or {}

    temp = weather.get("temp_c")
    rainfall = weather.get("rainfall_mm")

    # Weather reasoning
    w_score = components.get("weather_suitability", 0)
    if w_score >= 80:
        if temp and rainfall:
            points.append(f"Live weather ({temp:.1f}°C, {int(rainfall)}mm rainfall) matches optimal cultivation conditions for {crop_name}.")
        else:
            points.append(f"Observed weather conditions are optimal for {crop_name}.")
    elif w_score >= 50:
        points.append(f"Weather conditions ({temp:.1f}°C) are acceptable for {crop_name}, though supplemental monitoring is recommended.")
    else:
        points.append(f"Weather conditions are challenging for {crop_name} — consider protected cultivation or irrigation backup.")

    # Soil reasoning
    s_score = components.get("soil_compatibility", 0)
    if s_score >= 80:
        points.append(f"Your selected soil type is highly compatible ({s_score}/100) for growing {crop_name}.")
    elif s_score >= 50:
        points.append(f"Soil conditions are moderately suitable ({s_score}/100) — application of organic compost will enhance yield.")
    else:
        points.append(f"Soil suitability is low ({s_score}/100) — soil conditioning or alternate crop selection recommended.")

    # MSP & Price reasoning
    msp = crop_info.get("msp_per_quintal")
    p_score = components.get("price_trend", 0)
    m_score = components.get("market_demand", 0)

    if msp:
        if p_score >= 80:
            points.append(f"Market prices are trending above the Government Minimum Support Price (MSP ₹{int(msp)}/quintal).")
        else:
            points.append(f"Protected by Government MSP baseline of ₹{int(msp)}/quintal.")
    elif m_score >= 80:
        points.append(f"Local APMC Mandi demand for {crop_name} is currently high with upward price momentum.")

    # Seasonal reasoning
    se_score = components.get("seasonal_fit", 0)
    if se_score >= 80:
        points.append(f"{season.capitalize()} is the primary recommended sowing season for {crop_name}.")

    # Water reasoning
    wa_score = components.get("water_availability", 0)
    if wa_score >= 80:
        points.append("Your irrigation setup matches the crop's water requirement efficiency index.")
    elif wa_score < 50:
        points.append("Water requirements are high — drip irrigation recommended to prevent moisture stress.")

    return points[:4]
