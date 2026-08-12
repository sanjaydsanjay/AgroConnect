import React from 'react';
import type { CropRecommendation } from '../../../types';
import { MOCK_RECOMMENDATIONS } from '../../../lib/mockData';
import { SuitabilityScoreBadge } from '../ui/SuitabilityScoreBadge';
import { RiskIndicator } from '../ui/RiskIndicator';
import { SquareButton } from '../ui/SquareButton';
import { formatINR } from '../../../lib/utils';
import { X, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface CropCompareModalProps {
  onClose: () => void;
  onSelectList: (crop: CropRecommendation) => void;
}

export const CropCompareModal: React.FC<CropCompareModalProps> = ({ onClose, onSelectList }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-[#ebebeb] rounded-xl max-w-4xl w-full p-6 shadow-2xl animate-zoom-in overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ebebeb] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717]">Side-by-Side Crop Comparison</h3>
              <p className="text-xs text-[#8f8f8f]">Compare suitability scores, expected returns, and risk profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8f8f8f] hover:text-[#171717] p-1.5 rounded-md hover:bg-[#fafafa] transition-transform duration-200 hover:rotate-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Up Side by Side Grid */}
        <div className="overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
          {MOCK_RECOMMENDATIONS.map((rec, idx) => (
            <div key={rec.id} className="bg-[#fafafa] border border-[#ebebeb] rounded-xl p-4 flex flex-col justify-between hover:border-[#171717] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-eyebrow bg-[#171717] text-white px-2 py-0.5 rounded-md">
                    OPTION #{idx + 1}
                  </span>
                  <SuitabilityScoreBadge score={rec.suitabilityScore} showMeter={false} />
                </div>

                <h4 className="text-base font-bold text-[#171717] mb-1">{rec.cropName}</h4>
                <p className="text-xs text-[#8f8f8f] mb-3">{rec.category}</p>

                <div className="space-y-2 text-xs mb-4">
                  <div className="bg-white border border-[#ebebeb] p-2.5 rounded-lg">
                    <span className="text-[10px] font-mono-eyebrow text-[#8f8f8f] block">PROFIT / ACRE</span>
                    <span className="font-bold text-[#171717]">
                      {formatINR(rec.profitMin)} – {formatINR(rec.profitMax)}
                    </span>
                  </div>

                  <div className="bg-white border border-[#ebebeb] p-2.5 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-mono-eyebrow text-[#8f8f8f]">MATURITY</span>
                    <span className="font-semibold text-[#171717]">{rec.growingPeriodDays} Days</span>
                  </div>

                  <div className="bg-white border border-[#ebebeb] p-2.5 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-mono-eyebrow text-[#8f8f8f]">WATER</span>
                    <span className="font-semibold text-[#171717]">{rec.waterRequirement}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <RiskIndicator score={rec.riskScore} category={rec.riskCategory} />
                </div>

                <ul className="space-y-1 text-xs text-[#4d4d4d] mb-4">
                  {rec.reasoning.slice(0, 2).map((r, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0070f3] mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <SquareButton
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => {
                  onSelectList(rec);
                  onClose();
                }}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Select & Create Listing
              </SquareButton>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#ebebeb] flex justify-end shrink-0">
          <SquareButton variant="ghost" onClick={onClose}>
            Close Comparison
          </SquareButton>
        </div>
      </div>
    </div>
  );
};
