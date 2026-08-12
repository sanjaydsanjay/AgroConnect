import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $farmProfile,
  updateFarmProfile,
  setRecommendations,
  $isCalculatingAI,
} from '../../../stores/farmStore';
import { TextInput } from '../ui/TextInput';
import { SquareButton } from '../ui/SquareButton';
import { addToast } from '../../../stores/toastStore';
import { getCropRecommendations } from '../../../lib/aiClient';
import type { AICropRecommendation } from '../../../types/ai-service';
import type { CropRecommendation } from '../../../types';
import { MOCK_RECOMMENDATIONS } from '../../../lib/mockData';
import { Sparkles, MapPin, Layers, Droplets, AlertCircle } from 'lucide-react';

// District lat/lon lookup (Karnataka)
const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Mandya:      { lat: 12.5228, lon: 76.8953 },
  Dharwad:     { lat: 15.4589, lon: 75.0078 },
  Belagavi:    { lat: 15.8497, lon: 74.4977 },
  Shimoga:     { lat: 13.9299, lon: 75.5681 },
  Hassan:      { lat: 13.0033, lon: 76.1004 },
  Bengaluru:   { lat: 12.9716, lon: 77.5946 },
  Ramanagara:  { lat: 12.7203, lon: 77.2821 },
};

// Map internal type to API type
const SOIL_MAP: Record<string, string> = {
  Loam: 'loamy', Clay: 'clay', Sandy: 'sandy', Black: 'black', Red: 'red',
};
const IRRIGATION_MAP: Record<string, string> = {
  Drip: 'drip', Canal: 'canal', Rainfed: 'rainfed', Borewell: 'drip',
};

function mapAIToInternal(rec: AICropRecommendation, idx: number): CropRecommendation {
  return {
    id: `ai_rec_${idx}`,
    cropName: rec.crop,
    category: rec.major_producing_states.length > 0 ? 'Recommended' : 'General',
    suitabilityScore: rec.score,
    riskScore: rec.risk,
    riskCategory: rec.risk < 34 ? 'Low' : rec.risk < 67 ? 'Medium' : 'High',
    profitMin: rec.profit_range.min,
    profitMax: rec.profit_range.max,
    growingPeriodDays: 90,
    waterRequirement:
      rec.components.water_availability > 70
        ? 'High'
        : rec.components.water_availability > 40
        ? 'Moderate'
        : 'Low',
    reasoning: rec.reasoning,
    sowingWindow: rec.sowing_window || 'Seasonal',
    marketDemand:
      rec.components.market_demand > 80
        ? 'Very High'
        : rec.components.market_demand > 60
        ? 'High'
        : rec.components.market_demand > 40
        ? 'Moderate'
        : 'Stable',
  };
}

export const FarmProfileForm: React.FC = () => {
  const farmProfile = useStore($farmProfile);
  const [district, setDistrict] = useState(farmProfile.district);
  const [landSize, setLandSize] = useState(farmProfile.landSize.toString());
  const [soilType, setSoilType] = useState(farmProfile.soilType);
  const [irrigationType, setIrrigationType] = useState(farmProfile.irrigationType);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [serviceError, setServiceError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServiceError(null);
    $isCalculatingAI.set(true);

    updateFarmProfile({
      district,
      landSize: parseFloat(landSize) || 4.5,
      soilType: soilType as any,
      irrigationType: irrigationType as any,
    });

    const coords = DISTRICT_COORDS[district] || { lat: 12.97, lon: 77.59 };

    try {
      setLoadingMsg('Fetching weather & soil data...');
      const res = await getCropRecommendations({
        latitude: coords.lat,
        longitude: coords.lon,
        season: 'kharif',
        soil_type: (SOIL_MAP[soilType] || 'loamy') as any,
        irrigation_type: (IRRIGATION_MAP[irrigationType] || 'drip') as any,
        land_size: parseFloat(landSize) || 4.5,
      });

      const mapped = res.recommendations.slice(0, 5).map(mapAIToInternal);
      setRecommendations(mapped);
      addToast({
        type: 'success',
        title: 'AI Recommendations Ready',
        message: `Ranked ${mapped.length} crops for ${district} district using live weather data.`,
      });
    } catch (err: any) {
      // Fallback to mock data when AI service is offline
      setServiceError('AI service offline — showing demo data.');
      setRecommendations(MOCK_RECOMMENDATIONS);
      addToast({
        type: 'info',
        title: 'Showing Demo Data',
        message: 'AI microservice is unavailable. Using fallback recommendations.',
      });
    } finally {
      setLoading(false);
      setLoadingMsg('');
      $isCalculatingAI.set(false);
    }
  };

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs">
      <div className="pb-4 mb-4 border-b border-[#ebebeb]">
        <h3 className="text-sm font-bold text-[#171717]">Farm Parameters</h3>
        <p className="text-xs text-[#8f8f8f] mt-0.5">AI scoring personalised for your land</p>
      </div>

      {serviceError && (
        <div className="flex items-start space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{serviceError}</span>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-[#171717] flex items-center space-x-1 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>District</span>
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:border-[#0070f3] focus-visible:ring-1 focus-visible:ring-[#0070f3] cursor-pointer"
          >
            {Object.keys(DISTRICT_COORDS).map((d) => (
              <option key={d} value={d}>{d} (Karnataka)</option>
            ))}
          </select>
        </div>

        <TextInput
          label="Land Size (Acres)"
          type="number"
          min="0.5"
          step="0.5"
          value={landSize}
          onChange={(e) => setLandSize(e.target.value)}
          required
        />

        <div>
          <label className="text-xs font-medium text-[#171717] flex items-center space-x-1 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Soil Type</span>
          </label>
          <select
            value={soilType}
            onChange={(e) => setSoilType(e.target.value as any)}
            className="w-full bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:border-[#0070f3] focus-visible:ring-1 focus-visible:ring-[#0070f3] cursor-pointer"
          >
            <option value="Loam">Loam (Optimal)</option>
            <option value="Clay">Clay (Water Retentive)</option>
            <option value="Sandy">Sandy (Quick Draining)</option>
            <option value="Black">Black Cotton</option>
            <option value="Red">Red Soil</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#171717] flex items-center space-x-1 mb-1.5">
            <Droplets className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Irrigation</span>
          </label>
          <select
            value={irrigationType}
            onChange={(e) => setIrrigationType(e.target.value as any)}
            className="w-full bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:border-[#0070f3] focus-visible:ring-1 focus-visible:ring-[#0070f3] cursor-pointer"
          >
            <option value="Drip">Drip Irrigation</option>
            <option value="Canal">Canal</option>
            <option value="Rainfed">Monsoon Rainfed</option>
            <option value="Borewell">Borewell</option>
          </select>
        </div>

        <SquareButton
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
          icon={<Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''} text-[#50e3c2]`} />}
        >
          {loading ? loadingMsg || 'Analysing…' : 'Get AI Recommendations'}
        </SquareButton>
      </form>
    </div>
  );
};
