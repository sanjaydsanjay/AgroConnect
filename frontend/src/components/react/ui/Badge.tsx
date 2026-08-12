import React from 'react';

export type BadgeVariant =
  | 'verified'
  | 'pending'
  | 'active'
  | 'sold'
  | 'lowRisk'
  | 'mediumRisk'
  | 'highRisk'
  | 'highDemand'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  verified:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  active:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  sold:       'bg-gray-100 text-gray-600 border-gray-200',
  lowRisk:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  mediumRisk: 'bg-amber-50 text-amber-700 border-amber-200',
  highRisk:   'bg-red-50 text-red-700 border-red-200',
  highDemand: 'bg-blue-50 text-[#0070f3] border-blue-200',
  neutral:    'bg-[#f2f2f2] text-[#4d4d4d] border-[#ebebeb]',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  icon,
}) => (
  <span
    className={`inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full border ${VARIANT_STYLES[variant]} ${className}`}
  >
    {icon}
    <span>{children}</span>
  </span>
);
