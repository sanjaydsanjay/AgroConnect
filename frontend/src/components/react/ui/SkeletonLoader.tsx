import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-[#ebebeb] animate-pulse rounded-md ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex justify-between items-center">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-full h-12 rounded-lg" />
      <div className="space-y-2 pt-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
      </div>
      <Skeleton className="w-full h-9 rounded-md mt-4" />
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><Skeleton className="w-32 h-4" /></td>
      <td className="px-5 py-4"><Skeleton className="w-24 h-4" /></td>
      <td className="px-5 py-4"><Skeleton className="w-20 h-4" /></td>
      <td className="px-5 py-4"><Skeleton className="w-16 h-5 rounded-full" /></td>
      <td className="px-5 py-4 text-right"><Skeleton className="w-20 h-7 rounded-md ml-auto" /></td>
    </tr>
  );
};
