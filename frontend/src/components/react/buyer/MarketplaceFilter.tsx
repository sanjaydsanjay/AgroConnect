import React from 'react';
import { useStore } from '@nanostores/react';
import {
  $listings,
  $searchQuery,
  $selectedCategory,
  $selectedDistrict,
  resetMarketplaceFilters,
} from '../../../stores/marketplaceStore';
import { Search, X } from 'lucide-react';

const CATEGORIES = ['All', 'Vegetables', 'Spices', 'Cereals', 'Pulses', 'Fruits'];
const DISTRICTS   = ['All', 'Mandya', 'Dharwad', 'Ramanagara', 'Bengaluru', 'Belagavi'];

export const MarketplaceFilter: React.FC = () => {
  const listings        = useStore($listings);
  const searchQuery     = useStore($searchQuery);
  const selectedCat     = useStore($selectedCategory);
  const selectedDist    = useStore($selectedDistrict);
  const hasFilters      = searchQuery !== '' || selectedCat !== 'All' || selectedDist !== 'All';

  const count = (cat: string, dist: string, q: string) => {
    const lq = q.trim().toLowerCase();
    return listings.filter((l) => {
      const matchQ   = !lq || l.cropName.toLowerCase().includes(lq) || l.farmerDistrict.toLowerCase().includes(lq) || l.farmerName.toLowerCase().includes(lq) || l.category.toLowerCase().includes(lq);
      const matchCat = cat  === 'All' || l.category.toLowerCase()      === cat.toLowerCase();
      const matchDist= dist === 'All' || l.farmerDistrict.toLowerCase() === dist.toLowerCase();
      return matchQ && matchCat && matchDist;
    }).length;
  };

  const current = count(selectedCat, selectedDist, searchQuery);

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-5 space-y-4">
      {/* Search + district row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8f8f8f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search crop, farmer, or district…"
            value={searchQuery}
            onChange={(e) => $searchQuery.set(e.target.value)}
            className="w-full bg-[#fafafa] border border-[#ebebeb] text-[#171717] text-sm rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3]"
          />
          {searchQuery && (
            <button
              onClick={() => $searchQuery.set('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8f8f8f] hover:text-[#171717]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={selectedDist}
          onChange={(e) => $selectedDistrict.set(e.target.value)}
          className="w-full md:w-48 bg-[#fafafa] border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#0070f3] cursor-pointer"
        >
          <option value="All">All districts</option>
          {DISTRICTS.filter((d) => d !== 'All').map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Category chips + result count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#ebebeb]">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCat.toLowerCase() === cat.toLowerCase();
            const n      = count(cat, selectedDist, searchQuery);
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => $selectedCategory.set(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] cursor-pointer ${
                  active
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#fafafa] text-[#4d4d4d] border border-[#ebebeb] hover:border-[#171717]'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-[#ebebeb] text-[#8f8f8f]'
                }`}>{n}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8f8f8f] shrink-0">
          <span>{current} listing{current !== 1 ? 's' : ''}</span>
          {hasFilters && (
            <button
              type="button"
              onClick={resetMarketplaceFilters}
              className="text-[#0070f3] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
