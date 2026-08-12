import React from 'react';
import type { CropRecommendation } from '../../../types';
import { ProduceListingForm } from './ProduceListingForm';
import { X } from 'lucide-react';

interface Props {
  isOpen?: boolean;
  initialCrop?: CropRecommendation | null;
  prefillCropName?: string;
  onClose: () => void;
}

export const CreateListingModal: React.FC<Props> = ({
  isOpen = true,
  initialCrop,
  prefillCropName,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-[#ebebeb] rounded-xl max-w-lg w-full p-6 shadow-xl animate-zoom-in overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#ebebeb]">
          <div>
            <h3 className="text-base font-semibold text-[#171717]">Create produce listing</h3>
            <p className="text-xs text-[#8f8f8f] mt-0.5">Publish to the buyer marketplace</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-[#8f8f8f] hover:text-[#171717] hover:bg-[#f2f2f2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ProduceListingForm
          isModal={true}
          initialCrop={initialCrop}
          prefillCropName={prefillCropName}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
