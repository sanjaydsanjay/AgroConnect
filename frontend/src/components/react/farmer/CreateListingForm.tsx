import React from 'react';
import { ProduceListingForm } from './ProduceListingForm';
import { SquareButton } from '../ui/SquareButton';
import { ArrowLeft } from 'lucide-react';

export const CreateListingForm: React.FC = () => {
  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs max-w-xl mx-auto">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#ebebeb]">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
            Post Produce Listing
          </h2>
          <p className="text-xs text-[#8f8f8f] mt-0.5">
            Specify crop variety, asking price, and harvest availability for verified buyers.
          </p>
        </div>
        <a href="/farmer/listings">
          <SquareButton variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back
          </SquareButton>
        </a>
      </div>

      <ProduceListingForm />
    </div>
  );
};
