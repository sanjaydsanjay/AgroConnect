import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface VerificationBadgeProps {
  label?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ label = 'Verified' }) => {
  return (
    <span className="inline-flex items-center space-x-1 text-xs font-medium text-[#0070f3] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3 text-[#0070f3]" />
      <span>{label}</span>
    </span>
  );
};
