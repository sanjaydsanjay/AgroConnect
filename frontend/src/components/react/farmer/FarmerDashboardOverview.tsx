import React from 'react';
import { useStore } from '@nanostores/react';
import { $authSession } from '../../../stores/authStore';
import { $listings } from '../../../stores/marketplaceStore';
import { $orders } from '../../../stores/orderStore';
import { t } from '../../../i18n';
import { SquareButton } from '../ui/SquareButton';
import { Badge } from '../ui/Badge';
import { WeatherSummaryWidget } from '../ui/WeatherSummaryWidget';
import { formatINR } from '../../../lib/utils';
import type { WeatherData } from '../../../types';
import { Cpu, ArrowRight, Layers, ShoppingBag, MapPin, Sparkles } from 'lucide-react';

export const FarmerDashboardOverview: React.FC = () => {
  const session = useStore($authSession);
  const user = session.user;
  const lang = user?.preferredLanguage || 'en';

  const listings = useStore($listings);
  const orders = useStore($orders);

  // Filter listings and orders belonging to this farmer or general
  const farmerListings = listings.filter((l) => l.farmerId === user?.id || !user?.id);
  const farmerOrders = orders.filter((o) => o.farmerId === user?.id || !user?.id);

  // Default live weather structure for summary widget
  const liveWeather: WeatherData = {
    temperature: 27,
    humidity: 68,
    rainfallExpected: 12,
    season: 'Kharif',
    forecastSummary: 'Optimal condition for Kharif crops',
    location: 'Mandya, Karnataka',
  };

  return (
    <div className="space-y-6">
      {/* Weather Widget */}
      <WeatherSummaryWidget weather={liveWeather} />

      {/* Reactive Localized Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs">
          <p className="text-xs text-[#666666] mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#0070f3]" /> {t('profile.district', lang)}
          </p>
          <p className="text-lg font-semibold text-[#171717]">Mandya</p>
          <p className="text-xs text-[#666666] mt-0.5">4.5 {t('profile.landSize', lang)} · {t('cropPlanner.loam', lang)}</p>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs">
          <p className="text-xs text-[#666666] mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" /> {t('nav.myListings', lang)}
          </p>
          <p className="text-lg font-semibold text-[#171717]">{farmerListings.length}</p>
          <p className="text-xs text-emerald-600 mt-0.5 font-medium">{t('dashboard.liveMarketplace', lang)}</p>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs">
          <p className="text-xs text-[#666666] mb-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-[#0070f3]" /> {t('nav.orders', lang)}
          </p>
          <p className="text-lg font-semibold text-[#171717]">{farmerOrders.length}</p>
          <p className="text-xs text-[#0070f3] mt-0.5 font-medium">{t('dashboard.activeInquiries', lang)}</p>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs">
          <p className="text-xs text-[#666666] mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {t('dashboard.aiTopPick', lang)}
          </p>
          <p className="text-lg font-semibold text-[#171717]">91% {t('dashboard.score', lang)}</p>
          <p className="text-xs text-[#666666] mt-0.5">Ragi (GPU 28)</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top AI Pick */}
        <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="font-mono-eyebrow text-[#0070f3] block mb-1">
              {t('dashboard.recommended', lang)}
            </span>
            <h3 className="text-base font-semibold text-[#171717] mb-1">Ragi (Finger Millet)</h3>
            <p className="text-xs text-[#666666] mb-4">{t('weather.kharifSeason', lang)} · 105 Days</p>

            <div className="border border-[#ebebeb] bg-[#fafafa] rounded-lg p-3 mb-4">
              <p className="text-xs text-[#666666] mb-0.5">{t('cropPlanner.estimatedReturn', lang)}</p>
              <p className="text-base font-bold text-emerald-700">
                {formatINR(42000)} – {formatINR(65000)}
              </p>
            </div>
          </div>

          <a href="/farmer/crop-planner">
            <SquareButton variant="ghost" className="w-full" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              {t('nav.smartCropPlanner', lang)}
            </SquareButton>
          </a>
        </div>

        {/* Reactive Produce Listings Table */}
        <div className="lg:col-span-2 bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#171717]">{t('nav.myListings', lang)}</h3>
              <p className="text-xs text-[#666666] mt-0.5">{t('dashboard.visibleToBuyers', lang)}</p>
            </div>
            <a href="/farmer/listings">
              <SquareButton variant="ghost" size="sm">{t('dashboard.manage', lang)}</SquareButton>
            </a>
          </div>

          {farmerListings.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#666666]">
              {t('dashboard.noListings', lang)}
            </div>
          ) : (
            <div className="space-y-2">
              {farmerListings.slice(0, 4).map((lst) => (
                <div key={lst.id} className="flex items-center justify-between py-3 border-b border-[#f2f2f2] last:border-0 text-xs">
                  <div>
                    <p className="font-medium text-[#171717] text-sm">{lst.cropName}</p>
                    <p className="text-[#666666] mt-0.5">{lst.quantity} qtl · Harvest {lst.harvestDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#171717] text-sm">
                      {formatINR(lst.askingPrice)}
                      <span className="text-xs font-normal text-[#666666]">/qtl</span>
                    </p>
                    <Badge variant={lst.status === 'Active' ? 'active' : lst.status === 'Pending' ? 'pending' : 'neutral'}>
                      {lst.status === 'Active' ? t('common.active', lang) : lst.status === 'Pending' ? t('common.pending', lang) : lst.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
