import React from 'react';
import { useStore } from '@nanostores/react';
import { $orders } from '../../../stores/orderStore';
import { OrderStatusBadge } from '../ui/OrderStatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { formatINR, formatDate } from '../../../lib/utils';
import { ShoppingBag } from 'lucide-react';

export const BuyerOrdersTable: React.FC = () => {
  const orders = useStore($orders);

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-[#ebebeb]">
        <h3 className="text-base font-bold text-[#171717]">Submitted Purchase Requests</h3>
        <p className="text-xs text-[#8f8f8f]">Track status of your produce inquiries</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="No Submitted Orders"
          description="Inquiries you submit on the produce marketplace will appear here."
          actionLabel="Browse Marketplace"
          onAction={() => (window.location.href = '/buyer/marketplace')}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#ebebeb] text-[11px] font-mono-eyebrow text-[#8f8f8f]">
              <tr>
                <th scope="col" className="px-5 py-3">CROP NAME</th>
                <th scope="col" className="px-5 py-3">REQUESTED QTY</th>
                <th scope="col" className="px-5 py-3">OFFER PRICE</th>
                <th scope="col" className="px-5 py-3">TOTAL VALUE</th>
                <th scope="col" className="px-5 py-3">STATUS</th>
                <th scope="col" className="px-5 py-3">SUBMITTED DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#fafafa]/60 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#171717]">{ord.cropName}</td>
                  <td className="px-5 py-4 text-xs text-[#4d4d4d]">{ord.requestedQuantity} Quintals</td>
                  <td className="px-5 py-4 font-bold text-[#171717]">{formatINR(ord.offerPrice)} / qtl</td>
                  <td className="px-5 py-4 font-bold text-[#0070f3]">{formatINR(ord.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <OrderStatusBadge status={ord.status} />
                  </td>
                  <td className="px-5 py-4 text-xs text-[#8f8f8f]">
                    {formatDate(ord.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
