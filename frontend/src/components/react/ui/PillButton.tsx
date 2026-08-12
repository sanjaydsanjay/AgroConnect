import React from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'category';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'primary',
  children,
  icon,
  className = '',
  ...props
}) => {
  let baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.97] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer ';

  if (variant === 'primary') {
    baseStyles += 'bg-[#171717] text-white hover:bg-black hover:shadow-md rounded-[100px] px-5 py-2.5 text-sm tracking-wide shadow-sm ';
  } else if (variant === 'secondary') {
    baseStyles += 'bg-white text-[#171717] hover:bg-[#fafafa] hover:shadow-md border border-[#ebebeb] hover:border-[#171717] rounded-[100px] px-5 py-2.5 text-sm shadow-xs ';
  } else if (variant === 'outline') {
    baseStyles += 'bg-transparent text-[#171717] border border-[#ebebeb] hover:border-[#171717] hover:bg-white/80 rounded-[100px] px-4 py-2 text-xs ';
  } else if (variant === 'category') {
    baseStyles += 'bg-white text-[#171717] border border-[#ebebeb] hover:border-[#171717] hover:bg-[#fafafa] rounded-[64px] px-4 py-1.5 text-xs ';
  }

  return (
    <button className={`${baseStyles} ${className}`} {...props}>
      {icon && <span className="mr-2 transition-transform group-hover:scale-110">{icon}</span>}
      {children}
    </button>
  );
};
