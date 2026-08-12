import React from 'react';

interface SquareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-[6px] transition-colors duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer select-none';

const SIZE: Record<string, string> = {
  sm: 'px-2.5 py-1 text-xs h-7 min-w-[28px]',
  md: 'px-3.5 py-1.5 text-sm h-9',
  lg: 'px-5 py-2 text-sm h-10',
};

const VARIANT: Record<string, string> = {
  primary: 'bg-[#171717] text-white hover:bg-black shadow-xs',
  ghost:   'bg-white text-[#171717] border border-[#ebebeb] hover:border-[#171717] hover:bg-[#fafafa]',
  danger:  'bg-[#ee0000] text-white hover:bg-[#c50000] shadow-xs',
  success: 'bg-[#0070f3] text-white hover:bg-[#0761d1] shadow-xs',
};

export const SquareButton: React.FC<SquareButtonProps> = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  children,
  icon,
  className = '',
  ...props
}) => (
  <button
    type={type}
    className={`${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`}
    {...props}
  >
    {icon}
    {children}
  </button>
);
