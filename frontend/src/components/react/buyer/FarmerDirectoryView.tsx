import React from 'react';
import { useStore } from '@nanostores/react';
import { $authSession } from '../../../stores/authStore';
import { $listings } from '../../../stores/marketplaceStore';
import { t } from '../../../i18n';
import { SquareButton } from '../ui/SquareButton';
import { VerificationBadge } from '../ui/VerificationBadge';
import { MapPin, UserCheck, Sprout } from 'lucide-react';

export const FarmerDirectoryView: React.FC = () => {
  const session = useStore($authSession);
  const lang = session.user?.preferredLanguage || 'en';
  const listings = useStore($listings);

  // Group unique farmers from active listings
  const farmersMap = new Map();

  listings.forEach((lst) => {
    if (!farmersMap.has(lst.farmerId)) {
      farmersMap.set(lst.farmerId, {
        id: lst.farmerId,
        name: lst.farmerName || 'Verified Farmer',
        district: lst.farmerDistrict || 'Mandya',
        verified: lst.farmerVerified ?? true,
        cropCount: 1,
        crops: [lst.cropName],
      });
    } else {
      const existing = farmersMap.get(lst.farmerId);
      existing.cropCount += 1;
      if (!existing.crops.includes(lst.cropName)) {
        existing.crops.push(lst.cropName);
      }
    }
  });

  const farmersList = Array.from(farmersMap.values());

  if (farmersList.length === 0) {
    farmersList.push({
      id: 'f_default_1',
      name: 'Ramesh Gowda',
      district: 'Mandya',
      verified: true,
      cropCount: 2,
      crops: ['Ragi', 'Tomato'],
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {farmersList.map((f) => (
        <div key={f.id} className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-[#171717] transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-base">
                {f.name.charAt(0)}
              </span>
              {f.verified ? <VerificationBadge /> : <span className="text-xs text-amber-600">Pending</span>}
            </div>

            <h3 className="text-lg font-bold text-[#171717] mb-0.5">{f.name}</h3>
            <p className="text-xs text-[#8f8f8f] mb-3 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>{f.district} District, Karnataka</span>
            </p>

            <div className="bg-[#fafafa] border border-[#ebebeb] p-3 rounded-lg space-y-1.5 text-xs text-[#4d4d4d] mb-4">
              <div className="flex justify-between">
                <span className="text-[#8f8f8f]">Active Produce:</span>
                <span className="font-semibold text-[#171717]">{f.cropCount} Listings</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8f8f8f]">Crops Grown:</span>
                <span className="font-semibold text-[#0070f3]">{f.crops.join(', ')}</span>
              </div>
            </div>
          </div>

          <a href="/buyer/marketplace">
            <SquareButton variant="primary" className="w-full">
              <span>View Produce Listings</span>
            </SquareButton>
          </a>
        </div>
      ))}
    </div>
  );
};
