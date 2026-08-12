import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $listings } from '../../../stores/marketplaceStore';
import { OrderStatusBadge } from '../ui/OrderStatusBadge';
import { SquareButton } from '../ui/SquareButton';
import { EmptyState } from '../ui/EmptyState';
import { CreateListingModal } from './CreateListingModal';
import { formatINR } from '../../../lib/utils';
import { Plus, Tag } from 'lucide-react';

export const FarmerListingsView: React.FC = () => {
  const listings = useStore($listings);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb]">
        <div>
          <p className="text-xs text-[#8f8f8f]">Showing {listings.length} live produce listings</p>
        </div>
        <SquareButton
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create New Listing
        </SquareButton>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-6 h-6" />}
          title="No Produce Listings Posted"
          description="Click 'Create New Listing' to publish your crops to verified commercial buyers."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((lst) => (
            <div
              key={lst.id}
              className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs hover:border-[#171717] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono bg-[#fafafa] border border-[#ebebeb] text-[#4d4d4d] px-2 py-0.5 rounded-md">
                    {lst.qualityGrade}
                  </span>
                  <OrderStatusBadge status={lst.status} />
                </div>

                <h3 className="text-base font-bold text-[#171717] mb-1">{lst.cropName}</h3>
                <p className="text-xs text-[#8f8f8f] mb-4">{lst.category}</p>

                <div className="bg-[#fafafa] border border-[#ebebeb] p-3 rounded-lg mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#8f8f8f] block">ASKING PRICE</span>
                    <span className="text-base font-bold text-[#171717]">{formatINR(lst.askingPrice)} / qtl</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#8f8f8f] block">QUANTITY</span>
                    <span className="text-sm font-semibold text-[#171717]">{lst.quantity} Qtl</span>
                  </div>
                </div>

                {lst.description && (
                  <p className="text-xs text-[#4d4d4d] mb-4 italic line-clamp-2">"{lst.description}"</p>
                )}
              </div>

              <div className="border-t border-[#ebebeb] pt-3 flex items-center justify-between text-xs text-[#8f8f8f]">
                <span>Harvest: {lst.harvestDate || 'Ready'}</span>
                <span className="text-[#0070f3] font-medium">{lst.farmerDistrict} District</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModalOpen && (
        <CreateListingModal onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
};
