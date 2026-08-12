import React from 'react';

interface GeistCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  padding?: 'compact' | 'standard' | 'large';
  onClick?: () => void;
}

const PADDING: Record<string, string> = {
  compact: 'p-4',
  standard: 'p-5',
  large: 'p-6',
};

export const GeistCard: React.FC<GeistCardProps> = ({
  children,
  className = '',
  elevated = false,
  padding = 'standard',
  onClick,
}) => {
  const shadowStyle = elevated
    ? 'shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-[#ebebeb]'
    : 'border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={`bg-white rounded-xl border ${PADDING[padding]} transition-all duration-150 ${shadowStyle} ${
        onClick ? 'cursor-pointer hover:border-[#171717] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
