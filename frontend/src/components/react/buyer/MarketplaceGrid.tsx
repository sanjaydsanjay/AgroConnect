import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $listings,
  $searchQuery,
  $selectedCategory,
  $selectedDistrict,
  resetMarketplaceFilters,
} from '../../../stores/marketplaceStore';
import type { CropListing } from '../../../types';
import { CropListingCard } from './CropListingCard';
import { OrderInquiryModal } from './OrderInquiryModal';
import { getBulkMarketPrices } from '../../../lib/aiClient';
import type { MandiPriceResult } from '../../../types/ai-service';
import { SearchX, RotateCcw } from 'lucide-react';
import { SquareButton } from '../ui/SquareButton';

export const MarketplaceGrid: React.FC = () => {
  const listings = useStore($listings);
  const searchQuery = useStore($searchQuery);
  const selectedCategory = useStore($selectedCategory);
  const selectedDistrict = useStore($selectedDistrict);
  const [activeOrderListing, setActiveOrderListing] = useState<CropListing | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, MandiPriceResult>>({});

  const q = searchQuery.trim().toLowerCase();

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      !q ||
      l.cropName.toLowerCase().includes(q) ||
      l.farmerDistrict.toLowerCase().includes(q) ||
      l.farmerName.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q);
    const matchesCat =
      selectedCategory === 'All' ||
      l.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
    const matchesDist =
      selectedDistrict === 'All' ||
      l.farmerDistrict.trim().toLowerCase() === selectedDistrict.trim().toLowerCase();
    return matchesSearch && matchesCat && matchesDist;
  });

  // Fetch live mandi prices for visible listings
  useEffect(() => {
    if (filteredListings.length === 0) return;
    const controller = new AbortController();

    const queries = filteredListings.map((l) => ({
      crop: l.cropName.split(' ')[0], // first word e.g. "Tomato"
      district: l.farmerDistrict,
    }));

    getBulkMarketPrices(queries, controller.signal)
      .then((res) => {
        const map: Record<string, MandiPriceResult> = {};
        res.results.forEach((r) => {
          map[r.crop.toLowerCase()] = r;
        });
        setLivePrices(map);
      })
      .catch(() => {/* service offline — silently ignore, fall back to listing price */});

    return () => controller.abort();
  }, [selectedCategory, selectedDistrict]);

  return (
    <>
      {filteredListings.length === 0 ? (
        <div className="bg-white border border-[#ebebeb] rounded-xl p-10 text-center shadow-xs">
          <SearchX className="w-8 h-8 text-[#a1a1a1] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#171717] mb-1">No listings found</h3>
          <p className="text-xs text-[#8f8f8f] mb-4">
            Try adjusting the search query, category, or district filter.
          </p>
          <SquareButton
            variant="ghost"
            size="sm"
            onClick={resetMarketplaceFilters}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Filters
          </SquareButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((lst) => {
            const key = lst.cropName.split(' ')[0].toLowerCase();
            const livePrice = livePrices[key];
            return (
              <CropListingCard
                key={lst.id}
                listing={lst}
                liveMandiPrice={livePrice?.modal_price}
                onSelectOrder={(listing) => setActiveOrderListing(listing)}
              />
            );
          })}
        </div>
      )}

      {activeOrderListing && (
        <OrderInquiryModal
          listing={activeOrderListing}
          onClose={() => setActiveOrderListing(null)}
        />
      )}
    </>
  );
};
