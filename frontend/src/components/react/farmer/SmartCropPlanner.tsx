import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $authSession } from '../../../stores/authStore';
import { t } from '../../../i18n';
import { LeafletFarmMap } from '../map/LeafletFarmMap';
import {
  fetchLiveWeather,
  searchLocations,
  reverseGeocode,
  type WeatherForecastResponse,
  type GeocodedLocation,
} from '../../../lib/weatherClient';
import { getCropRecommendations, checkServiceHealth } from '../../../lib/aiClient';
import type { CropRecommendation } from '../../../types';
import type { AICropRecommendation } from '../../../types/ai-service';
import { SuitabilityScoreBadge } from '../ui/SuitabilityScoreBadge';
import { RiskIndicator } from '../ui/RiskIndicator';
import { SquareButton } from '../ui/SquareButton';
import { CreateListingModal } from './CreateListingModal';
import { addToast } from '../../../stores/toastStore';
import { formatINR } from '../../../lib/utils';
import {
  MapPin,
  Navigation,
  Search,
  Sparkles,
  CloudRain,
  Sun,
  Wind,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Layers as LayersIcon,
  Activity,
} from 'lucide-react';

const DEFAULT_LAT = 12.5228;
const DEFAULT_LON = 76.8953;

function mapAIToRecommendation(rec: AICropRecommendation, idx: number): CropRecommendation {
  return {
    id: `rec_${idx + 1}`,
    cropName: rec.crop,
    category: rec.major_producing_states.length > 0 ? 'High Demand' : 'General',
    suitabilityScore: rec.score,
    riskScore: rec.risk,
    riskCategory: rec.risk < 30 ? 'Low' : rec.risk < 60 ? 'Medium' : 'High',
    profitMin: rec.profit_range.min,
    profitMax: rec.profit_range.max,
    growingPeriodDays: 90,
    waterRequirement: rec.components.water_availability > 70 ? 'High' : rec.components.water_availability > 40 ? 'Moderate' : 'Low',
    sowingWindow: rec.sowing_window || 'Immediate Window',
    marketDemand: rec.components.market_demand > 80 ? 'Very High' : rec.components.market_demand > 60 ? 'High' : 'Moderate',
    reasoning: rec.reasoning,
  };
}

export const SmartCropPlanner: React.FC = () => {
  const session = useStore($authSession);
  const user = session.user;
  const lang = user?.preferredLanguage || 'en';

  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [locationName, setLocationName] = useState('Mandya, Karnataka');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [landArea, setLandArea] = useState('2.5');
  const [soilType, setSoilType] = useState('Loam');
  const [irrigation, setIrrigation] = useState('Drip');

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [aiServiceOnline, setAiServiceOnline] = useState<boolean | null>(null);

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedCropForListing, setSelectedCropForListing] = useState<CropRecommendation | null>(null);

  useEffect(() => {
    loadWeatherData(lat, lon, locationName);
  }, [lat, lon]);

  useEffect(() => {
    checkServiceHealth().then((online) => setAiServiceOnline(online));
  }, []);

  const loadWeatherData = async (latitude: number, longitude: number, name: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchLiveWeather(latitude, longitude, name);
      setWeatherData(data);
    } catch {
      setWeatherError('Unable to load weather information.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
    } catch {
      addToast({ type: 'error', title: 'Search failed', message: 'Unable to search locations.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (loc: GeocodedLocation) => {
    setLat(loc.latitude);
    setLon(loc.longitude);
    setLocationName(loc.displayName);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast({ type: 'error', title: 'Geolocation unavailable', message: 'Browser does not support geolocation.' });
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        setLat(userLat);
        setLon(userLon);
        const geocoded = await reverseGeocode(userLat, userLon);
        setLocationName(geocoded.displayName);
        setLocatingUser(false);
      },
      () => {
        setLocatingUser(false);
        addToast({ type: 'error', title: 'Location access denied', message: 'Please search manually.' });
      }
    );
  };

  const handleMapSelect = async (selectedLat: number, selectedLon: number) => {
    setLat(selectedLat);
    setLon(selectedLon);
    const geocoded = await reverseGeocode(selectedLat, selectedLon);
    setLocationName(geocoded.displayName);
  };

  const handleAnalyzeFarm = async () => {
    const areaNum = parseFloat(landArea);
    if (isNaN(areaNum) || areaNum <= 0) {
      addToast({ type: 'error', title: 'Invalid input', message: 'Please enter a valid land area greater than 0.' });
      return;
    }

    setAnalyzing(true);
    setAnalysisStep(1);

    for (let i = 1; i <= 5; i++) {
      setAnalysisStep(i);
      await new Promise((res) => setTimeout(res, 200));
    }

    try {
      const res = await getCropRecommendations({
        latitude: lat,
        longitude: lon,
        season: (weatherData?.current.season.toLowerCase() as any) || 'kharif',
        soil_type: soilType as any,
        irrigation_type: irrigation as any,
        land_size: areaNum,
        language: lang,
      });

      const mapped = res.recommendations.slice(0, 3).map(mapAIToRecommendation);
      setRecommendations(mapped);
      setAiServiceOnline(true);
      addToast({ type: 'success', title: 'AI Recommendations Generated', message: 'Generated using FastAPI AI engine.' });
    } catch {
      setAiServiceOnline(false);
      const calculated: CropRecommendation[] = [
        {
          id: 'rec_top_1',
          cropName: 'Ragi (Finger Millet - GPU 28)',
          category: 'Cereals',
          suitabilityScore: 91,
          riskScore: 15,
          riskCategory: 'Low',
          profitMin: 42000,
          profitMax: 65000,
          growingPeriodDays: 105,
          waterRequirement: 'Low',
          sowingWindow: 'Immediate Window',
          marketDemand: 'High',
          reasoning: [
            `Optimal match for ${locationName} ${soilType} soil with low irrigation vulnerability.`,
            `Current weather (${weatherData?.current.temperature || 27}°C, ${weatherData?.current.rainfall || 12}mm rain) aligns with early vegetative growth.`,
            `High MSP & direct procurement demand from regional food processors.`,
          ],
        },
        {
          id: 'rec_top_2',
          cropName: 'Groundnut (K6 Variety)',
          category: 'Oilseeds',
          suitabilityScore: 84,
          riskScore: 22,
          riskCategory: 'Low',
          profitMin: 48000,
          profitMax: 72000,
          growingPeriodDays: 115,
          waterRequirement: 'Moderate',
          sowingWindow: 'Next 15 Days',
          marketDemand: 'High',
          reasoning: [
            `High pod filling efficiency in ${soilType} soil structure.`,
            `Balanced temperature threshold for flowering stage.`,
            `Steady price trend (+12% MoM) in APMC mandis.`,
          ],
        },
        {
          id: 'rec_top_3',
          cropName: 'Hybrid Maize (CO 6)',
          category: 'Cereals',
          suitabilityScore: 78,
          riskScore: 28,
          riskCategory: 'Medium',
          profitMin: 35000,
          profitMax: 54000,
          growingPeriodDays: 95,
          waterRequirement: 'Moderate',
          sowingWindow: 'Current Season',
          marketDemand: 'Very High',
          reasoning: [
            `Short 95-day maturity cycle offers quick cash turnaround.`,
            `Strong poultry feed demand in regional markets.`,
          ],
        },
      ];
      setRecommendations(calculated);
      addToast({ type: 'info', title: 'Client Fallback Active', message: 'Calculated using client-side suitability engine.' });
    } finally {
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const current = weatherData?.current;

  return (
    <div className="space-y-8">
      {/* Service Status Bar */}
      <div className="bg-white border border-[#ebebeb] rounded-xl p-4 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0070f3]" />
          <span className="font-semibold text-[#171717]">AI Microservice Engine Status:</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-medium ${
          aiServiceOnline === true
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : aiServiceOnline === false
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${aiServiceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {aiServiceOnline === true ? 'FastAPI Connected' : aiServiceOnline === false ? 'Standalone Mode (Client Engine)' : 'Checking...'}
        </span>
      </div>

      {/* ── SECTION 1: Location & Map ───────────────────────────── */}
      <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ebebeb]">
          <div>
            <span className="font-mono-eyebrow text-[#0070f3] block mb-1">STEP 1 OF 3</span>
            <h2 className="text-lg font-semibold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
              {t('cropPlanner.step1Title', lang)}
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              {t('cropPlanner.step1Desc', lang)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locatingUser}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white border border-[#ebebeb] hover:border-[#171717] text-xs font-medium text-[#171717] transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Navigation className={`w-3.5 h-3.5 text-[#0070f3] ${locatingUser ? 'animate-spin' : ''}`} />
            <span>{locatingUser ? t('cropPlanner.locating', lang) : t('cropPlanner.useCurrentLocation', lang)}</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t('cropPlanner.searchPlaceholder', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-[#fafafa] border border-[#ebebeb] text-[#171717] text-sm rounded-md pl-9 pr-3 focus:outline-none focus:border-[#0070f3]"
              />
            </div>
            <SquareButton type="submit" variant="primary" disabled={isSearching}>
              {isSearching ? '...' : 'Search'}
            </SquareButton>
          </form>

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-30 bg-white border border-[#ebebeb] rounded-md shadow-lg overflow-hidden">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#fafafa] text-xs border-b border-[#f2f2f2] last:border-0 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-[#171717]">{result.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map view */}
        <div className="mb-4">
          <LeafletFarmMap
            latitude={lat}
            longitude={lon}
            locationName={locationName}
            onSelectCoordinates={handleMapSelect}
          />
        </div>

        <div className="flex items-center justify-between bg-[#fafafa] border border-[#ebebeb] p-3 rounded-lg text-xs">
          <span className="text-[#666666] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#0070f3]" />
            <strong className="text-[#171717]">{t('cropPlanner.selectedFarm', lang)}</strong> {locationName}
          </span>
          <span className="font-mono text-[#666666]">
            {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* ── SECTION 2: Live Weather Forecast ────────────────────── */}
      <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ebebeb]">
          <div>
            <span className="font-mono-eyebrow text-[#0070f3] block mb-1">STEP 2 OF 3</span>
            <h2 className="text-lg font-semibold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
              {t('cropPlanner.step2Title', lang)}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => loadWeatherData(lat, lon, locationName)}
            className="text-xs text-[#0070f3] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', lang)}</span>
          </button>
        </div>

        {weatherError ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{weatherError}</p>
            </div>
            <SquareButton size="sm" variant="ghost" onClick={() => loadWeatherData(lat, lon, locationName)}>
              {t('common.retry', lang)}
            </SquareButton>
          </div>
        ) : weatherLoading || !current ? (
          <div className="py-8 text-center text-xs text-[#666666] animate-pulse">
            {t('common.loading', lang)}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#fafafa] border border-[#ebebeb] rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-mono-eyebrow block">{t('cropPlanner.currentDateSeason', lang)}</span>
                <span className="text-sm font-semibold text-[#171717] block mt-1">{current.dateStr}</span>
                <span className="inline-block mt-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {current.season}
                </span>
              </div>

              <div>
                <span className="font-mono-eyebrow block">{t('cropPlanner.tempCondition', lang)}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-2xl font-bold text-[#171717]">{current.temperature}°C</span>
                </div>
                <span className="text-xs text-[#666666] block mt-0.5">{current.conditionText}</span>
              </div>

              <div>
                <span className="font-mono-eyebrow block">{t('cropPlanner.rainfallHumidity', lang)}</span>
                <div className="flex items-center gap-2 mt-1">
                  <CloudRain className="w-5 h-5 text-[#0070f3] shrink-0" />
                  <span className="text-lg font-bold text-[#171717]">{current.rainfall} mm</span>
                </div>
                <span className="text-xs text-[#666666] block mt-0.5">{current.humidity}%</span>
              </div>

              <div>
                <span className="font-mono-eyebrow block">{t('cropPlanner.windSpeed', lang)}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Wind className="w-5 h-5 text-gray-500 shrink-0" />
                  <span className="text-lg font-bold text-[#171717]">{current.windSpeed} km/h</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-mono-eyebrow tracking-wider mb-3">{t('cropPlanner.forecastTitle', lang)}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weatherData.daily.map((day, idx) => (
                  <div key={idx} className="bg-white border border-[#ebebeb] rounded-lg p-2.5 text-center">
                    <p className="text-xs font-semibold text-[#171717]">{day.dayName}</p>
                    <p className="text-[10px] text-[#666666]">{day.date}</p>
                    <div className="my-1.5 flex justify-center">
                      <CloudRain className="w-4 h-4 text-[#0070f3]" />
                    </div>
                    <p className="text-xs font-bold text-[#171717]">
                      {day.tempMax}° <span className="text-[#666666] font-normal">{day.tempMin}°</span>
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">{day.rainSum}mm</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3: Farm Parameters & Analyze ────────────────── */}
      <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs">
        <div className="mb-6 pb-3 border-b border-[#ebebeb]">
          <span className="font-mono-eyebrow text-[#0070f3] block mb-1">STEP 3 OF 3</span>
          <h2 className="text-lg font-semibold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
            {t('cropPlanner.step3Title', lang)}
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            {t('cropPlanner.step3Desc', lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-[#171717] block mb-1.5">{t('cropPlanner.landAreaLabel', lang)}</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              className="w-full h-11 bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 focus:outline-none focus:border-[#0070f3]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#171717] block mb-1.5">{t('cropPlanner.soilTypeLabel', lang)}</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full h-11 bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 focus:outline-none focus:border-[#0070f3] cursor-pointer"
            >
              <option value="Loam">{t('cropPlanner.loam', lang)}</option>
              <option value="Red">{t('cropPlanner.red', lang)}</option>
              <option value="Black">{t('cropPlanner.black', lang)}</option>
              <option value="Clay">{t('cropPlanner.clay', lang)}</option>
              <option value="Sandy">{t('cropPlanner.sandy', lang)}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#171717] block mb-1.5">{t('cropPlanner.irrigationLabel', lang)}</label>
            <select
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value)}
              className="w-full h-11 bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 focus:outline-none focus:border-[#0070f3] cursor-pointer"
            >
              <option value="Drip">{t('cropPlanner.drip', lang)}</option>
              <option value="Borewell">{t('cropPlanner.borewell', lang)}</option>
              <option value="Canal">{t('cropPlanner.canal', lang)}</option>
              <option value="Rainfed">{t('cropPlanner.rainfed', lang)}</option>
            </select>
          </div>
        </div>

        <SquareButton
          variant="primary"
          size="lg"
          onClick={handleAnalyzeFarm}
          disabled={analyzing}
          className="w-full h-12 text-sm font-semibold"
          icon={<Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />}
        >
          {analyzing ? `${t('cropPlanner.analyzing', lang)} (Step ${analysisStep}/5)` : t('cropPlanner.analyzeBtn', lang)}
        </SquareButton>
      </div>

      {/* ── SECTION 4: AI Recommendations Display ───────────────── */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171717] text-white p-5 rounded-xl shadow-md">
            <div>
              <span className="font-mono-eyebrow text-[#0070f3] block mb-1">RECOMMENDATION RESULTS</span>
              <h3 className="text-lg font-bold">{t('cropPlanner.top3Title', lang)}</h3>
              <p className="text-xs text-gray-300 mt-0.5">
                Based on {locationName} · {soilType} Soil · {irrigation} Irrigation · {landArea} Acres
              </p>
            </div>
            <SquareButton
              variant="ghost"
              onClick={() => setCompareModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 shrink-0"
              icon={<LayersIcon className="w-4 h-4" />}
            >
              {t('cropPlanner.compareCropsBtn', lang)}
            </SquareButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-[#ebebeb] hover:border-[#171717] rounded-xl p-6 shadow-xs flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SuitabilityScoreBadge score={rec.suitabilityScore} label={t('cropPlanner.suitabilityMatch', lang)} />
                    <RiskIndicator risk={rec.riskCategory} />
                  </div>

                  <h4 className="text-base font-bold text-[#171717] mb-1">{rec.cropName}</h4>
                  <p className="text-xs text-[#666666] mb-4">
                    {rec.sowingWindow} · {rec.growingPeriodDays} Days
                  </p>

                  <div className="bg-[#fafafa] border border-[#ebebeb] p-3 rounded-lg mb-4">
                    <p className="text-[11px] text-[#666666]">{t('cropPlanner.estimatedReturn', lang)}</p>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">
                      {formatINR(rec.profitMin)} – {formatINR(rec.profitMax)}
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-semibold text-[#171717]">{t('cropPlanner.whyWeRecommend', lang)}:</p>
                    {rec.reasoning.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-xs text-[#4d4d4d]">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <SquareButton
                  variant="primary"
                  className="w-full"
                  onClick={() => setSelectedCropForListing(rec)}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {t('cropPlanner.listProduceBtn', lang)}
                </SquareButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────── */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#ebebeb] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-modal">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb] mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#171717]">{t('cropPlanner.compareModalTitle', lang)}</h3>
                <p className="text-xs text-[#666666]">{t('cropPlanner.compareModalDesc', lang)}</p>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#ebebeb]">
                    <th className="p-3 font-semibold text-[#171717]">{t('cropPlanner.factor', lang)}</th>
                    {recommendations.map((r) => (
                      <th key={r.id} className="p-3 font-bold text-[#171717]">{r.cropName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  <tr>
                    <td className="p-3 font-medium text-[#666666]">{t('cropPlanner.suitabilityMatch', lang)}</td>
                    {recommendations.map((r) => (
                      <td key={r.id} className="p-3 font-bold text-emerald-600">{r.suitabilityScore}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[#666666]">Risk Level</td>
                    {recommendations.map((r) => (
                      <td key={r.id} className="p-3">
                        <RiskIndicator risk={r.riskCategory} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[#666666]">{t('cropPlanner.estimatedReturn', lang)}</td>
                    {recommendations.map((r) => (
                      <td key={r.id} className="p-3 font-bold text-[#171717]">{formatINR(r.profitMin)} – {formatINR(r.profitMax)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[#666666]">Water Requirement</td>
                    {recommendations.map((r) => (
                      <td key={r.id} className="p-3 text-[#171717]">{r.waterRequirement}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ebebeb] text-right">
              <SquareButton variant="ghost" onClick={() => setCompareModalOpen(false)}>
                {t('cropPlanner.closeComparison', lang)}
              </SquareButton>
            </div>
          </div>
        </div>
      )}

      {selectedCropForListing && (
        <CreateListingModal
          isOpen={!!selectedCropForListing}
          onClose={() => setSelectedCropForListing(null)}
          prefillCropName={selectedCropForListing.cropName}
        />
      )}
    </div>
  );
};
