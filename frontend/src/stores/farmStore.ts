import { atom } from 'nanostores';
import type { FarmerProfile, CropRecommendation } from '../types';
import { MOCK_FARMER_PROFILE, MOCK_RECOMMENDATIONS } from '../lib/mockData';

function getInitialValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export const $farmProfile = atom<FarmerProfile>(getInitialValue('agro_farm_profile', MOCK_FARMER_PROFILE));
export const $recommendations = atom<CropRecommendation[]>(getInitialValue('agro_recommendations', MOCK_RECOMMENDATIONS));
export const $isCalculatingAI = atom<boolean>(false);

if (typeof window !== 'undefined') {
  $farmProfile.subscribe((profile) => {
    try {
      localStorage.setItem('agro_farm_profile', JSON.stringify(profile));
    } catch {}
  });
  $recommendations.subscribe((recs) => {
    try {
      localStorage.setItem('agro_recommendations', JSON.stringify(recs));
    } catch {}
  });
}

export function updateFarmProfile(updated: Partial<FarmerProfile>) {
  $farmProfile.set({
    ...$farmProfile.get(),
    ...updated,
  });
}

export function setRecommendations(recs: CropRecommendation[]) {
  $recommendations.set(recs);
}
