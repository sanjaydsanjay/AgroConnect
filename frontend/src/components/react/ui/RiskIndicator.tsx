import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { getRiskColor } from '../../../lib/utils';

interface RiskIndicatorProps {
  score?: number;
  category?: 'Low' | 'Medium' | 'High';
  risk?: 'Low' | 'Medium' | 'High';
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ score, category, risk }) => {
  const riskCategory = risk || category || 'Low';
  const color = getRiskColor(riskCategory);

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${color.bg} ${color.text}`}>
      {riskCategory === 'Low' ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
      <span>{riskCategory} Risk {score !== undefined ? `(${score}/100)` : ''}</span>
    </div>
  );
};
