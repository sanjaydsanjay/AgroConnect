import { atom } from 'nanostores';
import type { CropListing } from '../types';
import { MOCK_LISTINGS } from '../lib/mockData';

function getInitialValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export const $listings = atom<CropListing[]>(getInitialValue('agro_listings', MOCK_LISTINGS));
export const $searchQuery = atom<string>(getInitialValue('agro_search_query', ''));
export const $selectedCategory = atom<string>(getInitialValue('agro_selected_category', 'All'));
export const $selectedDistrict = atom<string>(getInitialValue('agro_selected_district', 'All'));

if (typeof window !== 'undefined') {
  $listings.subscribe((listings) => {
    try {
      localStorage.setItem('agro_listings', JSON.stringify(listings));
    } catch {}
  });
  $searchQuery.subscribe((q) => {
    try {
      localStorage.setItem('agro_search_query', JSON.stringify(q));
    } catch {}
  });
  $selectedCategory.subscribe((cat) => {
    try {
      localStorage.setItem('agro_selected_category', JSON.stringify(cat));
    } catch {}
  });
  $selectedDistrict.subscribe((dist) => {
    try {
      localStorage.setItem('agro_selected_district', JSON.stringify(dist));
    } catch {}
  });
}

export function addListing(newListing: CropListing) {
  $listings.set([newListing, ...$listings.get()]);
}

export function updateListingStatus(listingId: string, status: CropListing['status']) {
  $listings.set(
    $listings.get().map((item) => (item.id === listingId ? { ...item, status } : item))
  );
}

export function resetMarketplaceFilters() {
  $searchQuery.set('');
  $selectedCategory.set('All');
  $selectedDistrict.set('All');
}
