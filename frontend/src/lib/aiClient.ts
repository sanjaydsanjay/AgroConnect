/**
 * AI Microservice API Client
 * Calls FastAPI ai-service at PUBLIC_AI_SERVICE_URL (default: http://localhost:8000)
 * Handles input normalization, timeouts, and graceful offline fallback.
 */

import type {
  RecommendationRequest,
  RecommendationResponse,
  BulkPriceQuery,
  BulkPriceResponse,
  VoiceSearchRequest,
  VoiceSearchResponse,
  MarketIntelResponse,
  MarketTrendItem,
  MarketDemandItem,
  AnalyticsSummary,
} from '../types/ai-service';

const AI_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_AI_SERVICE_URL) ||
  'http://localhost:8000';

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Maps frontend UI soil names to exact FastAPI backend schema options
 */
export function normalizeSoilType(soil: string): RecommendationRequest['soil_type'] {
  const normalized = soil.trim().toLowerCase();
  if (normalized.includes('loam')) return 'loamy';
  if (normalized.includes('clay')) return 'clay';
  if (normalized.includes('sandy')) return 'sandy';
  if (normalized.includes('red')) return 'red';
  if (normalized.includes('black')) return 'black';
  if (normalized.includes('alluvial')) return 'alluvial';
  if (normalized.includes('laterite')) return 'laterite';
  return 'loamy'; // safe default
}

/**
 * Maps frontend UI irrigation names to exact FastAPI backend schema options
 */
export function normalizeIrrigationType(irrigation: string): RecommendationRequest['irrigation_type'] {
  const normalized = irrigation.trim().toLowerCase();
  if (normalized.includes('drip')) return 'drip';
  if (normalized.includes('sprinkler')) return 'sprinkler';
  if (normalized.includes('canal')) return 'canal';
  if (normalized.includes('flood')) return 'flood';
  if (normalized.includes('rainfed') || normalized.includes('rain')) return 'rainfed';
  return 'drip'; // safe default
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  return { 'Content-Type': 'application/json' };
}

/**
 * Fetch AI crop recommendations from the FastAPI microservice.
 * Throws an error with a descriptive message on failure.
 */
export async function getCropRecommendations(
  payload: RecommendationRequest,
  signal?: AbortSignal
): Promise<RecommendationResponse> {
  const headers = await getAuthHeaders();
  if (payload.language) {
    headers['Accept-Language'] = payload.language;
  }

  // Normalize payload attributes to strictly conform to backend schema
  const normalizedPayload: RecommendationRequest = {
    ...payload,
    soil_type: normalizeSoilType(payload.soil_type),
    irrigation_type: normalizeIrrigationType(payload.irrigation_type),
    season: (payload.season?.toLowerCase() as any) || 'kharif',
  };

  // Combine caller signal with default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BASE_URL}/api/recommend`, {
      method: 'POST',
      headers,
      body: JSON.stringify(normalizedPayload),
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let detail = `AI Service responded with ${response.status}`;
      try {
        const err = await response.json();
        detail = err.detail || detail;
      } catch {/* ignore parse error */}
      throw new Error(detail);
    }

    return (await response.json()) as RecommendationResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI Service request timed out.');
    }
    throw err;
  }
}

/**
 * Parse regional spoken text or multilingual transcript into structured crop, state, & intent.
 */
export async function parseVoiceCropQuery(
  spokenText: string,
  language: string = 'auto',
  signal?: AbortSignal
): Promise<VoiceSearchResponse> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BASE_URL}/api/voice-search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ spoken_text: spokenText, language }),
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Voice search service error (${response.status})`);
    }

    return (await response.json()) as VoiceSearchResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Voice search service request timed out.');
    }
    throw err;
  }
}

/**
 * Fetch live mandi spot prices for a batch of crops.
 */
export async function getBulkMarketPrices(
  queries: BulkPriceQuery[],
  signal?: AbortSignal
): Promise<BulkPriceResponse> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BASE_URL}/api/market/bulk-prices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ queries }),
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Market price service error (${response.status})`);
    }

    return (await response.json()) as BulkPriceResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Market price service request timed out.');
    }
    throw err;
  }
}

/**
 * Fetch market price trends and 7-day change analytics.
 */
export async function getMarketTrends(
  crop?: string,
  signal?: AbortSignal
): Promise<MarketTrendItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${AI_BASE_URL}/api/market/trends`);
  if (crop) url.searchParams.append('crop', crop);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Market trend error (${response.status})`);
    return (await response.json()) as MarketTrendItem[];
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch platform demand indicators.
 */
export async function getMarketDemand(signal?: AbortSignal): Promise<MarketDemandItem[]> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BASE_URL}/api/market/demand`, {
      method: 'GET',
      headers,
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Demand analytics error (${response.status})`);
    return (await response.json()) as MarketDemandItem[];
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch platform analytics summary for admin dashboard.
 */
export async function getAnalyticsSummary(signal?: AbortSignal): Promise<AnalyticsSummary> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BASE_URL}/api/analytics/summary`, {
      method: 'GET',
      headers,
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Analytics summary error (${response.status})`);
    return (await response.json()) as AnalyticsSummary;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Health check — returns true if the AI service is reachable.
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${AI_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

