import React from 'react';
import { useStore } from '@nanostores/react';
import { $orders, updateOrderStatus } from '../../../stores/orderStore';
import { OrderStatusBadge } from '../ui/OrderStatusBadge';
import { SquareButton } from '../ui/SquareButton';
import { EmptyState } from '../ui/EmptyState';
import { addToast } from '../../../stores/toastStore';
import { formatINR } from '../../../lib/utils';
import { Check, X, ShoppingBag } from 'lucide-react';

export const FarmerOrdersTable: React.FC = () => {
  const orders = useStore($orders);

  const handleAccept = (orderId: string, cropName: string) => {
    updateOrderStatus(orderId, 'Accepted');
    addToast({
      type: 'success',
      title: 'Order Request Accepted',
      message: `Accepted order for ${cropName}. Buyer notified!`,
    });
  };

  const handleReject = (orderId: string, cropName: string) => {
    updateOrderStatus(orderId, 'Rejected');
    addToast({
      type: 'error',
      title: 'Order Request Declined',
      message: `Declined order for ${cropName}.`,
    });
  };

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-[#ebebeb]">
        <h3 className="text-base font-bold text-[#171717]">Received Purchase Requests</h3>
        <p className="text-xs text-[#8f8f8f]">Accept or decline buyer purchase inquiries</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="No Purchase Inquiries Yet"
          description="Inquiries submitted by commercial buyers for your produce listings will appear here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#ebebeb] text-[11px] font-mono-eyebrow text-[#8f8f8f]">
              <tr>
                <th scope="col" className="px-5 py-3">BUYER COMPANY</th>
                <th scope="col" className="px-5 py-3">CROP</th>
                <th scope="col" className="px-5 py-3">REQUESTED QTY</th>
                <th scope="col" className="px-5 py-3">OFFER PRICE</th>
                <th scope="col" className="px-5 py-3">TOTAL VALUE</th>
                <th scope="col" className="px-5 py-3">STATUS</th>
                <th scope="col" className="px-5 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#fafafa]/60 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#171717]">{ord.buyerCompany || ord.buyerName}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-[#171717]">{ord.cropName}</td>
                  <td className="px-5 py-4 text-xs text-[#4d4d4d]">{ord.requestedQuantity} Quintals</td>
                  <td className="px-5 py-4 font-bold text-[#171717]">{formatINR(ord.offerPrice)} / qtl</td>
                  <td className="px-5 py-4 font-bold text-[#0070f3]">{formatINR(ord.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <OrderStatusBadge status={ord.status} />
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {ord.status === 'Submitted' || ord.status === 'Under Review' ? (
                      <>
                        <SquareButton
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(ord.id, ord.cropName)}
                          icon={<Check className="w-3.5 h-3.5" />}
                        >
                          Accept
                        </SquareButton>
                        <SquareButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(ord.id, ord.cropName)}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          Decline
                        </SquareButton>
                      </>
                    ) : (
                      <span className="text-xs text-[#8f8f8f] font-mono-eyebrow">UPDATED</span>
                    )}
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
