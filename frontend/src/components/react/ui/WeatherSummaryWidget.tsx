import React from 'react';
import { useStore } from '@nanostores/react';
import { $authSession } from '../../../stores/authStore';
import { t } from '../../../i18n';
import { Sun, CloudRain, Droplets, MapPin } from 'lucide-react';
import type { WeatherData } from '../../../types';

interface WeatherSummaryWidgetProps {
  weather: WeatherData;
}

export const WeatherSummaryWidget: React.FC<WeatherSummaryWidgetProps> = ({ weather }) => {
  const session = useStore($authSession);
  const user = session.user;
  const lang = user?.preferredLanguage || 'en';

  const seasonText =
    weather.season === 'Kharif'
      ? t('weather.kharifSeason', lang)
      : weather.season === 'Rabi'
      ? t('weather.rabiSeason', lang)
      : t('weather.zaidSeason', lang);

  return (
    <div className="bg-white border border-[#ebebeb] p-4.5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
      <div>
        <span className="text-[11px] font-mono-eyebrow text-[#666666] flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-[#0070f3]" />
          <span>{weather.location}</span>
        </span>
        <h4 className="text-sm font-bold text-[#171717] flex items-center space-x-1.5 mt-0.5">
          <span>{seasonText} Forecast</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
        </h4>
      </div>

      <div className="flex items-center space-x-6 text-xs font-medium text-[#4d4d4d] border-t md:border-t-0 md:border-l border-[#ebebeb] pt-2 md:pt-0 md:pl-4">
        <div className="flex items-center space-x-1.5">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>{weather.temperature}°C {t('dashboard.temp', lang)}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span>{weather.humidity}% {t('dashboard.humidity', lang)}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <CloudRain className="w-4 h-4 text-emerald-500" />
          <span>{weather.rainfallExpected}mm {t('dashboard.rain', lang)}</span>
        </div>
      </div>
    </div>
  );
};
