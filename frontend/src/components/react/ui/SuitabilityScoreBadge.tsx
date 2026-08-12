import React from 'react';
import { getSuitabilityColor } from '../../../lib/utils';

interface SuitabilityScoreBadgeProps {
  score: number;
  showMeter?: boolean;
  label?: string;
}

export const SuitabilityScoreBadge: React.FC<SuitabilityScoreBadgeProps> = ({
  score,
  showMeter = true,
  label,
}) => {
  const color = getSuitabilityColor(score);

  return (
    <div className="inline-flex items-center space-x-2">
      <div className={`px-2.5 py-1 rounded-md border font-semibold text-xs ${color.bg} ${color.text} ${color.border}`}>
        {score}% {label || 'Match'}
      </div>
      {showMeter && (
        <div className="w-16 bg-[#ebebeb] rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
};
