import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatINR } from '../../../lib/utils';

interface ProfitEstimateCardProps {
  min: number;
  max: number;
}

export const ProfitEstimateCard: React.FC<ProfitEstimateCardProps> = ({ min, max }) => {
  return (
    <div className="bg-[#fafafa] border border-[#ebebeb] p-3 rounded-lg flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-mono-eyebrow text-[#8f8f8f] block">EXPECTED PROFIT / ACRE</span>
          <span className="text-sm font-semibold text-[#171717]">
            {formatINR(min)} – {formatINR(max)}
          </span>
        </div>
      </div>
    </div>
  );
};
