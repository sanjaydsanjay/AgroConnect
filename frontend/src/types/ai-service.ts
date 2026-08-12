/**
 * AI Microservice Type Definitions
 * Matches the FastAPI ai-service API schema exactly.
 */

export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  season: 'kharif' | 'rabi' | 'zaid';
  soil_type: 'loamy' | 'clay' | 'sandy' | 'red' | 'black' | 'alluvial' | 'laterite';
  irrigation_type: 'drip' | 'sprinkler' | 'canal' | 'flood' | 'rainfed';
  land_size: number; // acres
  language?: string;
}

export interface ProfitRange {
  min: number;
  max: number;
  currency: string;
  yield_per_acre_kg?: number;
  base_price_per_kg?: number;
  msp_per_quintal?: number;
}

export interface ComponentScores {
  weather_suitability: number;
  soil_compatibility: number;
  water_availability: number;
  market_demand: number;
  price_trend: number;
  seasonal_fit: number;
}

export interface AICropRecommendation {
  crop: string;
  hindi_name?: string;
  score: number;       // 0–100
  risk: number;        // 0–100
  profit_range: ProfitRange;
  components: ComponentScores;
  reasoning: string[];
  confidence: 'high' | 'medium' | 'low';
  sowing_window?: string;
  harvesting_window?: string;
  irrigation_advisory?: string;
  major_producing_states: string[];
}

export interface ProcessedContext {
  latitude: number;
  longitude: number;
  temperature_c: number;
  rainfall_mm: number;
  humidity_pct: number;
  weather_source: string;
  total_crops_evaluated: number;
}

export interface RecommendationResponse {
  generated_at: string;
  data_source: string;
  processed_context: ProcessedContext;
  recommendations: AICropRecommendation[];
}

export interface BulkPriceQuery {
  crop: string;
  district?: string;
  state?: string;
}

export interface MandiPriceResult {
  crop: string;
  district?: string;
  min_price?: number;
  max_price?: number;
  modal_price?: number;
  market_name?: string;
  source?: string;
  error?: string;
}

export interface BulkPriceResponse {
  results: MandiPriceResult[];
}

export interface VoiceSearchRequest {
  spoken_text: string;
  language?: string;
}

export interface VoiceCropMatch {
  crop: string;
  hindi_name?: string;
  matched_term: string;
  confidence_score: number;
  msp_per_quintal?: number;
  market_price_per_quintal?: number;
  trend?: string;
}

export interface VoiceSearchResponse {
  original_query: string;
  detected_language: string;
  intent: 'price_query' | 'recommendation_query' | 'general_search';
  matched_crop?: VoiceCropMatch;
  all_candidate_matches: VoiceCropMatch[];
  response_summary: string;
}

export interface MarketIntelResponse {
  crop: string;
  district: string;
  state?: string;
  mandi?: string;
  price: number;
  msp_per_quintal?: number;
  unit: string;
  trend: string;
  demand: string;
  suggested_selling_window: string;
  price_history_7d: number[];
  price_history_30d: number[];
  data_source: string;
}

export interface MarketTrendItem {
  crop: string;
  district: string;
  state: string;
  mandi: string;
  current_price: number;
  msp_per_quintal?: number;
  trend: string;
  price_change_7d_pct: number;
  price_history_7d: number[];
  suggested_selling_window: string;
}

export interface MarketDemandItem {
  crop: string;
  district: string;
  mandi: string;
  demand: string;
  current_price: number;
  msp_per_quintal?: number;
  demand_reason: string;
}

export interface AnalyticsSummary {
  total_recommendations: number;
  most_recommended_crop: string;
  avg_suitability_score: number;
  recommendation_distribution: Record<string, number>;
  real_data_metrics: Record<string, any>;
  generated_at: string;
}

