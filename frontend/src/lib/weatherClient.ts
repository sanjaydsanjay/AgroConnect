/**
 * Open-Meteo Weather Client & Geocoding Service
 * Provides real live weather data, 7-day forecast, location geocoding, and agricultural season determination.
 */

export interface CurrentWeather {
  temperature: number; // °C
  humidity: number; // %
  rainfall: number; // mm
  windSpeed: number; // km/h
  weatherCode: number;
  conditionText: string;
  locationName: string;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  dateStr: string;
}

export interface DailyForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rainSum: number;
  weatherCode: number;
  conditionText: string;
}

export interface WeatherForecastResponse {
  current: CurrentWeather;
  daily: DailyForecastDay[];
  latitude: number;
  longitude: number;
}

export interface GeocodedLocation {
  name: string;
  displayName: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/**
 * Interpret WMO Weather interpretation codes
 */
export function getWeatherConditionText(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Rain showers';
  if (code >= 71 && code <= 77) return 'Snow showers';
  if (code >= 80 && code <= 82) return 'Heavy rain showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Overcast';
}

/**
 * Calculate Indian Agricultural Season based on month & date
 */
export function getAgriculturalSeason(date: Date = new Date()): 'Kharif' | 'Rabi' | 'Zaid' {
  const month = date.getMonth() + 1; // 1 to 12
  if (month >= 6 && month <= 10) {
    return 'Kharif'; // Monsoon season (June to October)
  } else if (month >= 11 || month <= 2) {
    return 'Rabi'; // Winter season (November to February)
  } else {
    return 'Zaid'; // Summer season (March to May)
  }
}

/**
 * Fetch live weather data from Open-Meteo API
 */
export async function fetchLiveWeather(
  latitude: number,
  longitude: number,
  locationName: string = 'Your Farm'
): Promise<WeatherForecastResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather service returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const currentData = data.current;
  const dailyData = data.daily;

  const now = new Date();
  const season = getAgriculturalSeason(now);
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const current: CurrentWeather = {
    temperature: Math.round(currentData.temperature_2m),
    humidity: Math.round(currentData.relative_humidity_2m),
    rainfall: currentData.rain || 0,
    windSpeed: Math.round(currentData.wind_speed_10m),
    weatherCode: currentData.weather_code,
    conditionText: getWeatherConditionText(currentData.weather_code),
    locationName,
    season,
    dateStr,
  };

  const daily: DailyForecastDay[] = (dailyData.time || []).map((tStr: string, idx: number) => {
    const d = new Date(tStr);
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    return {
      date: formattedDate,
      dayName,
      tempMax: Math.round(dailyData.temperature_2m_max[idx]),
      tempMin: Math.round(dailyData.temperature_2m_min[idx]),
      rainSum: Math.round(dailyData.rain_sum[idx] * 10) / 10,
      weatherCode: dailyData.weather_code[idx],
      conditionText: getWeatherConditionText(dailyData.weather_code[idx]),
    };
  });

  return {
    current,
    daily,
    latitude,
    longitude,
  };
}

/**
 * Search locations using OpenStreetMap Nominatim Geocoding API
 */
export async function searchLocations(query: string): Promise<GeocodedLocation[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to search locations');
  }

  const results = await res.json();
  return results.map((item: any) => {
    const addr = item.address || {};
    const name = addr.village || addr.suburb || addr.town || addr.city || item.name;
    const district = addr.county || addr.district || addr.state_district || addr.city;
    const state = addr.state;
    const country = addr.country;

    const parts = [name, district, state].filter(Boolean);
    const displayName = parts.join(', ');

    return {
      name,
      displayName,
      village: addr.village || addr.suburb,
      district,
      state,
      country,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };
  });
}

/**
 * Reverse geocode latitude/longitude to address details
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) throw new Error('Reverse geocode failed');
    const item = await res.json();
    const addr = item.address || {};

    const name = addr.village || addr.suburb || addr.town || addr.city || 'Farm Location';
    const district = addr.county || addr.district || addr.state_district || addr.city || '';
    const state = addr.state || '';
    const country = addr.country || 'India';

    const parts = [name, district, state].filter(Boolean);
    const displayName = parts.join(', ');

    return {
      name,
      displayName,
      village: addr.village || addr.suburb,
      district,
      state,
      country,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return {
      name: 'Farm Location',
      displayName: `Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}`,
      latitude: lat,
      longitude: lon,
    };
  }
}
