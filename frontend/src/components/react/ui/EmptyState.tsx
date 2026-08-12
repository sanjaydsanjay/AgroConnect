import React from 'react';
import { SquareButton } from './SquareButton';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-12 text-center my-6 shadow-xs max-w-md mx-auto animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-[#fafafa] border border-[#ebebeb] text-[#8f8f8f] flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#171717] mb-1">{title}</h3>
      <p className="text-xs text-[#8f8f8f] max-w-xs mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <SquareButton variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </SquareButton>
      )}
    </div>
  );
};
