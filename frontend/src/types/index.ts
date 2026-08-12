export type UserRole = 'farmer' | 'buyer' | 'admin';
export type LanguageCode =
  | 'en' | 'kn' | 'hi' | 'te' | 'ta' | 'ml' | 'mr' | 'bn' | 'gu' | 'pa'
  | 'or' | 'as' | 'ur' | 'kok' | 'ne' | 'sa' | 'mai' | 'mni' | 'ks' | 'sd'
  | 'doi' | 'brx' | 'sat';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  verified: boolean;
  preferredLanguage?: LanguageCode;
  district?: string;
  state?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  landSize: number; // in acres
  soilType: 'Clay' | 'Loam' | 'Sandy' | 'Black' | 'Red';
  irrigationType: 'Rainfed' | 'Drip' | 'Canal' | 'Borewell';
  preferredCrops?: string[];
}

export interface CropRecommendation {
  id: string;
  cropName: string;
  category: string;
  suitabilityScore: number; // 0 - 100
  riskScore: number; // 0 - 100
  riskCategory: 'Low' | 'Medium' | 'High';
  profitMin: number; // ₹ per acre
  profitMax: number; // ₹ per acre
  growingPeriodDays: number;
  waterRequirement: 'Low' | 'Moderate' | 'High';
  reasoning: string[];
  sowingWindow: string;
  marketDemand: 'Very High' | 'High' | 'Moderate' | 'Stable';
}

export interface MarketPrice {
  id: string;
  cropName: string;
  category: string;
  marketName: string; // mandi name
  district: string;
  currentPrice: number; // ₹ per quintal
  previousPrice: number;
  priceTrendPercentage: number;
  trend: 'up' | 'down' | 'stable';
  suggestedSellingWindow: string;
  demandIndicator: 'High Demand' | 'Balanced' | 'Excess Supply';
  updatedAt: string;
}

export interface CropListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerDistrict: string;
  farmerState?: string;
  farmerPhone?: string;
  farmerVerified: boolean;
  cropName: string;
  category: string;
  quantity: number; // in quintals
  unit?: string;
  askingPrice: number; // ₹ per quintal
  qualityGrade: 'Grade A' | 'Grade B' | 'Grade C' | 'Organic Certified';
  harvestDate: string;
  status: 'Pending' | 'Active' | 'Rejected' | 'Sold';
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface BuyerOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerCompany?: string;
  farmerId?: string;
  farmerName?: string;
  listingId: string;
  cropName: string;
  requestedQuantity: number;
  offerPrice: number; // ₹ per quintal
  totalAmount: number;
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected' | 'Fulfilled';
  createdAt: string;
}

export interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  rainfallExpected: number; // mm
  season: 'Kharif' | 'Rabi' | 'Zaid';
  forecastSummary: string;
  location: string;
}

export interface PlatformAnalytics {
  totalFarmers: number;
  totalBuyers: number;
  totalListings: number;
  pendingVerifications: number;
  pendingListings: number;
  totalTradeVolumeINR: number;
  topDemandedCrops: { crop: string; demandIndex: number }[];
}
