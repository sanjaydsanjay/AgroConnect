import React from 'react';
import type { CropListing } from '../../../types';
import { VerificationBadge } from '../ui/VerificationBadge';
import { OrderStatusBadge } from '../ui/OrderStatusBadge';
import { SquareButton } from '../ui/SquareButton';
import { formatINR, formatDate } from '../../../lib/utils';
import { MapPin, Calendar, ShoppingCart, User, TrendingUp } from 'lucide-react';

interface CropListingCardProps {
  listing: CropListing;
  liveMandiPrice?: number; // from AI bulk-prices API — may be undefined when offline
  onSelectOrder: (listing: CropListing) => void;
}

export const CropListingCard: React.FC<CropListingCardProps> = ({
  listing,
  liveMandiPrice,
  onSelectOrder,
}) => {
  const priceDiff =
    liveMandiPrice != null ? liveMandiPrice - listing.askingPrice : null;
  const priceAboveAsk = priceDiff != null && priceDiff > 0;

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs hover:border-[#171717] transition-colors duration-150 flex flex-col justify-between">
      <div>
        {/* Quality badge + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono-eyebrow bg-[#fafafa] border border-[#ebebeb] text-[#4d4d4d] px-2 py-0.5 rounded-md">
            {listing.qualityGrade}
          </span>
          <OrderStatusBadge status={listing.status} />
        </div>

        {/* Crop name */}
        <h3 className="text-base font-bold text-[#171717] tracking-tight mb-0.5">
          {listing.cropName}
        </h3>
        <p className="text-xs text-[#8f8f8f] mb-3">{listing.category}</p>

        {/* Price box */}
        <div className="bg-[#fafafa] border border-[#ebebeb] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono-eyebrow text-[#8f8f8f] block">
                ASKING PRICE
              </span>
              <span className="text-base font-bold text-[#171717]">
                {formatINR(listing.askingPrice)}{' '}
                <span className="text-xs font-normal text-[#8f8f8f]">/ qtl</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono-eyebrow text-[#8f8f8f] block">
                AVAILABLE
              </span>
              <span className="text-sm font-semibold text-[#171717]">
                {listing.quantity} Qtl
              </span>
            </div>
          </div>

          {/* Live mandi price indicator */}
          {liveMandiPrice != null && (
            <div className="mt-2 pt-2 border-t border-[#ebebeb] flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1 text-[#8f8f8f]">
                <TrendingUp className="w-3 h-3" />
                <span>Mandi modal price</span>
              </span>
              <span
                className={`font-semibold ${
                  priceAboveAsk ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatINR(liveMandiPrice)}
                {priceDiff != null && (
                  <span className="ml-1 font-normal text-[10px]">
                    ({priceAboveAsk ? '+' : ''}
                    {formatINR(Math.abs(priceDiff))})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-4 text-xs text-[#4d4d4d]">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-[#8f8f8f]">
              <User className="w-3.5 h-3.5" />
              <span>Farmer</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="font-medium text-[#171717]">{listing.farmerName}</span>
              {listing.farmerVerified && <VerificationBadge label="" />}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-[#8f8f8f]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Origin</span>
            </span>
            <span className="font-medium text-[#171717]">{listing.farmerDistrict}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-[#8f8f8f]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Harvest</span>
            </span>
            <span className="font-medium text-[#171717]">{formatDate(listing.harvestDate)}</span>
          </div>
        </div>
      </div>

      <SquareButton
        variant="primary"
        className="w-full"
        onClick={() => onSelectOrder(listing)}
        icon={<ShoppingCart className="w-4 h-4" />}
      >
        Submit Order Request
      </SquareButton>
    </div>
  );
};
