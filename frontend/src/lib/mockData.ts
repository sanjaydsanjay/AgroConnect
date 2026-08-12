import type { 
  User, 
  FarmerProfile, 
  CropRecommendation, 
  MarketPrice, 
  CropListing, 
  BuyerOrder, 
  WeatherData,
  PlatformAnalytics
} from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr_f1',
    name: 'Ramesh Gowda',
    email: 'ramesh.gowda@farm.in',
    phone: '+91 98450 12345',
    role: 'farmer',
    verified: true,
    createdAt: '2026-01-15T08:30:00Z'
  },
  {
    id: 'usr_f2',
    name: 'Suresh Kumar',
    email: 'suresh.k@farm.in',
    phone: '+91 98450 67890',
    role: 'farmer',
    verified: false,
    createdAt: '2026-02-01T10:15:00Z'
  },
  {
    id: 'usr_b1',
    name: 'GreenFresh Agri Sourcing',
    email: 'procurement@greenfresh.com',
    phone: '+91 80 4123 9900',
    role: 'buyer',
    verified: true,
    createdAt: '2026-01-10T14:20:00Z'
  },
  {
    id: 'usr_b2',
    name: 'Apex Organics Pvt Ltd',
    email: 'sourcing@apexorganics.io',
    phone: '+91 80 2233 4455',
    role: 'buyer',
    verified: true,
    createdAt: '2026-01-20T09:00:00Z'
  },
  {
    id: 'usr_a1',
    name: 'AgroConnect Platform Admin',
    email: 'admin@agroconnect.org',
    role: 'admin',
    verified: true,
    createdAt: '2025-12-01T00:00:00Z'
  }
];

export const MOCK_FARMER_PROFILE: FarmerProfile = {
  id: 'fp_1',
  userId: 'usr_f1',
  village: 'Pandavapura',
  district: 'Mandya',
  state: 'Karnataka',
  latitude: 12.502,
  longitude: 76.671,
  landSize: 4.5,
  soilType: 'Loam',
  irrigationType: 'Drip',
  preferredCrops: ['Tomato', 'Sugarcane', 'Paddy']
};

export const MOCK_WEATHER: WeatherData = {
  temperature: 28.5,
  humidity: 65,
  rainfallExpected: 42,
  season: 'Kharif',
  forecastSummary: 'Optimal monsoon shower window expected over next 14 days with favorable night temperatures (20-22°C).',
  location: 'Mandya District, Karnataka'
};

export const MOCK_RECOMMENDATIONS: CropRecommendation[] = [
  {
    id: 'rec_1',
    cropName: 'hybrid Tomato (Arka Rakshak)',
    category: 'Vegetables',
    suitabilityScore: 92,
    riskScore: 18,
    riskCategory: 'Low',
    profitMin: 55000,
    profitMax: 78000,
    growingPeriodDays: 110,
    waterRequirement: 'Moderate',
    sowingWindow: 'Immediate (Next 10 Days)',
    marketDemand: 'Very High',
    reasoning: [
      'Loam soil in Mandya provides optimal aeration and moisture retention for Solanaceous crops.',
      'Drip irrigation reduces risk of early blight and saves 40% water consumption.',
      'Nearby Bengaluru & Mysuru mandis reporting 14% month-on-month price increase for Grade A tomatoes.'
    ]
  },
  {
    id: 'rec_2',
    cropName: 'Red Chilli (Byadgi Variety)',
    category: 'Spices',
    suitabilityScore: 84,
    riskScore: 28,
    riskCategory: 'Medium',
    profitMin: 62000,
    profitMax: 90000,
    growingPeriodDays: 150,
    waterRequirement: 'Moderate',
    sowingWindow: 'Late Kharif (Aug - Sept)',
    marketDemand: 'High',
    reasoning: [
      'High market demand for high oleoresin extraction chilli from export buyers.',
      'Current temperature band matches flowering threshold perfectly.',
      'Moderate water requirement matches drip system capacity seamlessly.'
    ]
  },
  {
    id: 'rec_3',
    cropName: 'Sweet Corn (Sugar75)',
    category: 'Cereals',
    suitabilityScore: 78,
    riskScore: 15,
    riskCategory: 'Low',
    profitMin: 38000,
    profitMax: 52000,
    growingPeriodDays: 85,
    waterRequirement: 'Low',
    sowingWindow: 'Anytime (Short Cycle)',
    marketDemand: 'Stable',
    reasoning: [
      'Short 85-day maturity cycle allows quick cash liquidity before main sugarcane crop.',
      'Low pest vulnerability compared to traditional cereals.',
      'Guaranteed buyback demand from regional food processors.'
    ]
  }
];

export const MOCK_MARKET_PRICES: MarketPrice[] = [
  {
    id: 'mp_1',
    cropName: 'Tomato',
    category: 'Vegetables',
    marketName: 'Mandya APMC Mandi',
    district: 'Mandya',
    currentPrice: 3200,
    previousPrice: 2800,
    priceTrendPercentage: 14.2,
    trend: 'up',
    suggestedSellingWindow: 'Next 2 Weeks (High Demand Window)',
    demandIndicator: 'High Demand',
    updatedAt: '2026-08-10T06:00:00Z'
  },
  {
    id: 'mp_2',
    cropName: 'Byadgi Chilli',
    category: 'Spices',
    marketName: 'Hubballi APMC',
    district: 'Dharwad',
    currentPrice: 18500,
    previousPrice: 17200,
    priceTrendPercentage: 7.5,
    trend: 'up',
    suggestedSellingWindow: 'Hold 3 Weeks for Export Rally',
    demandIndicator: 'High Demand',
    updatedAt: '2026-08-10T06:00:00Z'
  },
  {
    id: 'mp_3',
    cropName: 'Sweet Corn',
    category: 'Cereals',
    marketName: 'Bengaluru Wholesale Market',
    district: 'Bengaluru Urban',
    currentPrice: 1800,
    previousPrice: 1800,
    priceTrendPercentage: 0,
    trend: 'stable',
    suggestedSellingWindow: 'Steady Demand Anytime',
    demandIndicator: 'Balanced',
    updatedAt: '2026-08-10T06:00:00Z'
  },
  {
    id: 'mp_4',
    cropName: 'Onion (Nashik Red)',
    category: 'Vegetables',
    marketName: 'Yeshwanthpur Mandi',
    district: 'Bengaluru',
    currentPrice: 2400,
    previousPrice: 2700,
    priceTrendPercentage: -11.1,
    trend: 'down',
    suggestedSellingWindow: 'Wait for Harvest Dip Recovery',
    demandIndicator: 'Excess Supply',
    updatedAt: '2026-08-10T06:00:00Z'
  }
];

export const MOCK_LISTINGS: CropListing[] = [
  {
    id: 'lst_1',
    farmerId: 'usr_f1',
    farmerName: 'Ramesh Gowda',
    farmerDistrict: 'Mandya',
    farmerVerified: true,
    cropName: 'Fresh Tomato (Arka Rakshak)',
    category: 'Vegetables',
    quantity: 120,
    askingPrice: 3100,
    qualityGrade: 'Grade A',
    harvestDate: '2026-08-25',
    status: 'Active',
    description: 'Drip irrigated, pesticide-free fresh red tomatoes harvested at firm breaker stage. Excellent shelf life for inter-state transit.',
    createdAt: '2026-08-08T10:00:00Z'
  },
  {
    id: 'lst_2',
    farmerId: 'usr_f1',
    farmerName: 'Ramesh Gowda',
    farmerDistrict: 'Mandya',
    farmerVerified: true,
    cropName: 'Byadgi Red Chilli (Dried)',
    category: 'Spices',
    quantity: 45,
    askingPrice: 18200,
    qualityGrade: 'Grade A',
    harvestDate: '2026-09-10',
    status: 'Active',
    description: 'Sun-dried high color value red chillies with deep red sheen and low pungency. Ideal for spice extraction and export.',
    createdAt: '2026-08-09T14:30:00Z'
  },
  {
    id: 'lst_3',
    farmerId: 'usr_f2',
    farmerName: 'Suresh Kumar',
    farmerDistrict: 'Ramanagara',
    farmerVerified: false,
    cropName: 'Golden Sweet Corn',
    category: 'Cereals',
    quantity: 200,
    askingPrice: 1750,
    qualityGrade: 'Grade B',
    harvestDate: '2026-08-18',
    status: 'Pending',
    description: 'Uniform yellow sweet cobs with high Brix content. Ready for immediate processing or direct retail distribution.',
    createdAt: '2026-08-10T09:12:00Z'
  },
  {
    id: 'lst_4',
    farmerId: 'usr_f1',
    farmerName: 'Ramesh Gowda',
    farmerDistrict: 'Belagavi',
    farmerVerified: true,
    cropName: 'Organic Red Gram (Tur Dal)',
    category: 'Pulses',
    quantity: 80,
    askingPrice: 7400,
    qualityGrade: 'Organic Certified',
    harvestDate: '2026-09-01',
    status: 'Active',
    description: 'High protein unpolished red gram pulses naturally grown in fertile black soils of North Karnataka.',
    createdAt: '2026-08-10T11:00:00Z'
  },
  {
    id: 'lst_5',
    farmerId: 'usr_f2',
    farmerName: 'Suresh Kumar',
    farmerDistrict: 'Dharwad',
    farmerVerified: true,
    cropName: 'Kesar Pomegranate (Export Grade)',
    category: 'Fruits',
    quantity: 60,
    askingPrice: 9200,
    qualityGrade: 'Grade A',
    harvestDate: '2026-08-28',
    status: 'Active',
    description: 'Deep red arils with sweet juice content. Uniform fruit weight (300-350g) packaged in ventilated corrugated boxes.',
    createdAt: '2026-08-11T08:00:00Z'
  }
];

export const MOCK_ORDERS: BuyerOrder[] = [
  {
    id: 'ord_101',
    buyerId: 'usr_b1',
    buyerName: 'GreenFresh Agri Sourcing',
    buyerCompany: 'GreenFresh Foods Ltd',
    listingId: 'lst_1',
    cropName: 'Fresh Tomato (Arka Rakshak)',
    requestedQuantity: 50,
    offerPrice: 3050,
    totalAmount: 152500,
    status: 'Submitted',
    createdAt: '2026-08-09T16:00:00Z'
  },
  {
    id: 'ord_102',
    buyerId: 'usr_b2',
    buyerName: 'Apex Organics Pvt Ltd',
    buyerCompany: 'Apex Organics',
    listingId: 'lst_2',
    cropName: 'Byadgi Red Chilli (Dried)',
    requestedQuantity: 20,
    offerPrice: 18000,
    totalAmount: 360000,
    status: 'Under Review',
    createdAt: '2026-08-10T11:00:00Z'
  }
];

export const MOCK_ANALYTICS: PlatformAnalytics = {
  totalFarmers: 1248,
  totalBuyers: 342,
  totalListings: 890,
  pendingVerifications: 14,
  pendingListings: 8,
  totalTradeVolumeINR: 42800000,
  topDemandedCrops: [
    { crop: 'Tomato', demandIndex: 94 },
    { crop: 'Chilli (Byadgi)', demandIndex: 88 },
    { crop: 'Onion', demandIndex: 82 },
    { crop: 'Sweet Corn', demandIndex: 76 },
    { crop: 'Potato', demandIndex: 71 }
  ]
};
