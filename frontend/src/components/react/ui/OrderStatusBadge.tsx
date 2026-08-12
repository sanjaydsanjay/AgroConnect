import React from 'react';

interface OrderStatusBadgeProps {
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected' | 'Fulfilled' | 'Pending' | 'Active' | 'Sold';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  let style = 'bg-gray-100 text-gray-700 border-gray-200';

  if (status === 'Accepted' || status === 'Active' || status === 'Fulfilled') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'Under Review' || status === 'Pending' || status === 'Submitted') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (status === 'Rejected') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
};
