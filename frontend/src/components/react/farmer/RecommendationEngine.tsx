import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $recommendations, $isCalculatingAI } from '../../../stores/farmStore';
import type { CropRecommendation } from '../../../types';
import { FarmProfileForm } from './FarmProfileForm';
import { CropRecommendationCard } from './CropRecommendationCard';
import { CropCompareModal } from './CropCompareModal';
import { CreateListingModal } from './CreateListingModal';
import { SquareButton } from '../ui/SquareButton';
import { Layers, Cpu } from 'lucide-react';

// Simple skeleton row shown during AI calculation
const Skeleton: React.FC = () => (
  <div className="bg-white border border-[#ebebeb] rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-3 w-16 bg-[#f2f2f2] rounded" />
      <div className="h-5 w-12 bg-[#f2f2f2] rounded" />
    </div>
    <div className="h-5 w-40 bg-[#f2f2f2] rounded mb-3" />
    <div className="h-3 w-full bg-[#f2f2f2] rounded mb-2" />
    <div className="h-3 w-3/4 bg-[#f2f2f2] rounded" />
  </div>
);

export const RecommendationEngine: React.FC = () => {
  const recommendations = useStore($recommendations);
  const isCalculating = useStore($isCalculatingAI);
  const [cropForListing, setCropForListing] = useState<CropRecommendation | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Parameter form */}
      <div className="lg:col-span-1">
        <FarmProfileForm />
      </div>

      {/* Results panel */}
      <div className="lg:col-span-2 space-y-4">
        {/* Toolbar above results */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#4d4d4d]">
            {isCalculating
              ? 'Calculating…'
              : recommendations.length > 0
              ? `${recommendations.length} crops ranked for your farm`
              : 'Enter farm parameters to generate rankings'}
          </p>
          {recommendations.length > 1 && !isCalculating && (
            <SquareButton
              variant="ghost"
              size="sm"
              onClick={() => setCompareOpen(true)}
              icon={<Layers className="w-3.5 h-3.5" />}
            >
              Compare
            </SquareButton>
          )}
        </div>

        {/* Loading skeletons */}
        {isCalculating && (
          <div className="space-y-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        )}

        {/* Empty state */}
        {!isCalculating && recommendations.length === 0 && (
          <div className="bg-white border border-[#ebebeb] rounded-xl p-10 text-center">
            <Cpu className="w-8 h-8 text-[#a1a1a1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#171717] mb-1">No recommendations yet</p>
            <p className="text-sm text-[#8f8f8f]">
              Fill in your farm parameters and click <strong>Get AI Recommendations</strong>.
            </p>
          </div>
        )}

        {/* Results */}
        {!isCalculating && recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <CropRecommendationCard
                key={rec.id}
                recommendation={rec}
                rank={idx + 1}
                onSelectList={(crop) => setCropForListing(crop)}
                onCompareCrops={() => setCompareOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      {compareOpen && (
        <CropCompareModal
          onClose={() => setCompareOpen(false)}
          onSelectList={(crop) => setCropForListing(crop)}
        />
      )}

      {cropForListing && (
        <CreateListingModal
          initialCrop={cropForListing}
          onClose={() => setCropForListing(null)}
        />
      )}
    </div>
  );
};
