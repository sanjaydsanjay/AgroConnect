import React from 'react';
import type { CropRecommendation } from '../../../types';
import { SuitabilityScoreBadge } from '../ui/SuitabilityScoreBadge';
import { RiskIndicator } from '../ui/RiskIndicator';
import { SquareButton } from '../ui/SquareButton';
import { CheckCircle, Clock, Calendar, ArrowRight, Layers } from 'lucide-react';
import { formatINR } from '../../../lib/utils';

interface Props {
  recommendation: CropRecommendation;
  rank: number;
  onSelectList: (crop: CropRecommendation) => void;
  onCompareCrops?: () => void;
}

export const CropRecommendationCard: React.FC<Props> = ({
  recommendation: rec,
  rank,
  onSelectList,
  onCompareCrops,
}) => (
  <div className="bg-white border border-[#ebebeb] rounded-xl p-6 hover:border-[#171717] transition-colors duration-150">
    {/* Header row */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-[#8f8f8f]">#{rank}</span>
        <span className="text-xs text-[#8f8f8f]">{rec.category}</span>
      </div>
      <SuitabilityScoreBadge score={rec.suitabilityScore} />
    </div>

    {/* Crop name */}
    <h3 className="text-base font-semibold text-[#171717] mb-3">
      {rec.cropName}
    </h3>

    {/* Meta chips */}
    <div className="flex flex-wrap gap-2 mb-4">
      <RiskIndicator score={rec.riskScore} category={rec.riskCategory} />
      <span className="inline-flex items-center gap-1 text-xs text-[#4d4d4d] bg-[#fafafa] border border-[#ebebeb] px-2.5 py-1 rounded-md">
        <Clock className="w-3 h-3 text-[#8f8f8f]" />
        {rec.growingPeriodDays} days
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-[#4d4d4d] bg-[#fafafa] border border-[#ebebeb] px-2.5 py-1 rounded-md">
        <Calendar className="w-3 h-3 text-[#8f8f8f]" />
        {rec.sowingWindow}
      </span>
    </div>

    {/* Profit estimate */}
    <div className="border border-[#ebebeb] rounded-lg p-3 mb-4">
      <p className="text-xs text-[#8f8f8f] mb-0.5">Estimated profit / acre</p>
      <p className="text-base font-semibold text-emerald-600">
        {formatINR(rec.profitMin)} – {formatINR(rec.profitMax)}
      </p>
    </div>

    {/* AI rationale */}
    <div className="bg-[#fafafa] border border-[#ebebeb] rounded-lg p-3 mb-5">
      <p className="text-xs text-[#8f8f8f] mb-2">AI reasoning</p>
      <ul className="space-y-1.5">
        {rec.reasoning.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-[#4d4d4d]">
            <CheckCircle className="w-3.5 h-3.5 text-[#0070f3] mt-0.5 shrink-0" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      {onCompareCrops && (
        <SquareButton
          variant="ghost"
          className="flex-1"
          onClick={onCompareCrops}
          icon={<Layers className="w-3.5 h-3.5" />}
        >
          Compare
        </SquareButton>
      )}
      <SquareButton
        variant="primary"
        className="flex-1"
        onClick={() => onSelectList(rec)}
        icon={<ArrowRight className="w-3.5 h-3.5" />}
      >
        List for sale
      </SquareButton>
    </div>
  </div>
);
