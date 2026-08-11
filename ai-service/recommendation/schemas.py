from pydantic import BaseModel
from typing import Literal, List, Dict, Optional, Any


class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    season: Literal["kharif", "rabi", "zaid"]
    soil_type: str
    irrigation_type: str
    land_size: float


class ComponentScores(BaseModel):
    weather_suitability: int
    soil_compatibility: int
    water_availability: int
    market_demand: int
    price_trend: int
    seasonal_fit: int


class ProfitRange(BaseModel):
    min: int
    max: int
    currency: str = "INR"
    yield_per_acre_kg: Optional[float] = None
    base_price_per_kg: Optional[float] = None
    msp_per_quintal: Optional[float] = None


class CropRecommendation(BaseModel):
    crop: str
    hindi_name: Optional[str] = None
    score: int
    risk: int
    profit_range: ProfitRange
    components: ComponentScores
    reasoning: List[str]
    confidence: Literal["high", "medium", "low"]
    sowing_window: Optional[str] = None
    harvesting_window: Optional[str] = None
    irrigation_advisory: Optional[str] = None
    major_producing_states: List[str] = []


class ProcessedContext(BaseModel):
    latitude: float
    longitude: float
    temperature_c: float
    rainfall_mm: float
    humidity_pct: float
    weather_source: str
    total_crops_evaluated: int = 15


class RecommendationResponse(BaseModel):
    generated_at: str
    data_source: str
    processed_context: ProcessedContext
    recommendations: List[CropRecommendation]


class MarketIntelResponse(BaseModel):
    crop: str
    district: str
    state: Optional[str] = None
    mandi: Optional[str] = None
    price: float
    msp_per_quintal: Optional[float] = None
    unit: str = "per quintal"
    trend: str
    demand: str
    suggested_selling_window: str
    price_history_7d: List[float]
    price_history_30d: List[float]
    data_source: str


class MarketQueryItem(BaseModel):
    crop: str
    district: Optional[str] = None
    state: Optional[str] = None


class BulkMarketPriceRequest(BaseModel):
    queries: List[MarketQueryItem]


class BulkMarketPriceResponse(BaseModel):
    results: List[MarketIntelResponse]
    total_items: int
    data_source: str


class MarketTrendItem(BaseModel):
    crop: str
    district: str
    state: str
    mandi: str
    current_price: float
    msp_per_quintal: Optional[float] = None
    trend: str
    price_change_7d_pct: float
    price_history_7d: List[float]
    suggested_selling_window: str


class MarketDemandItem(BaseModel):
    crop: str
    district: str
    mandi: str
    demand: str
    current_price: float
    msp_per_quintal: Optional[float] = None
    demand_reason: str


class AnalyticsSummary(BaseModel):
    total_recommendations: int
    most_recommended_crop: str
    avg_suitability_score: float
    recommendation_distribution: Dict[str, int]
    real_data_metrics: Dict[str, Any]
    generated_at: str


class VoiceSearchRequest(BaseModel):
    spoken_text: str
    language: Optional[str] = "auto"


class VoiceCropMatch(BaseModel):
    crop: str
    hindi_name: Optional[str] = None
    matched_term: str
    confidence_score: float
    msp_per_quintal: Optional[float] = None
    market_price_per_quintal: Optional[float] = None
    trend: Optional[str] = None


class VoiceSearchResponse(BaseModel):
    original_query: str
    detected_language: str
    intent: Literal["price_query", "recommendation_query", "general_search"]
    matched_crop: Optional[VoiceCropMatch] = None
    all_candidate_matches: List[VoiceCropMatch] = []
    response_summary: str

