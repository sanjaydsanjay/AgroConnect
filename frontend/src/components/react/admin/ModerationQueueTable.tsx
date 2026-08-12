import React from 'react';
import { useStore } from '@nanostores/react';
import { $listings, updateListingStatus } from '../../../stores/marketplaceStore';
import { OrderStatusBadge } from '../ui/OrderStatusBadge';
import { SquareButton } from '../ui/SquareButton';
import { EmptyState } from '../ui/EmptyState';
import { addToast } from '../../../stores/toastStore';
import { formatINR } from '../../../lib/utils';
import { CheckCircle2, XCircle, FileText, CheckCheck } from 'lucide-react';

export const ModerationQueueTable: React.FC = () => {
  const listings = useStore($listings);

  const handleApprove = (id: string, cropName: string) => {
    updateListingStatus(id, 'Active');
    addToast({
      type: 'success',
      title: 'Listing Approved',
      message: `${cropName} is now live on the marketplace.`,
    });
  };

  const handleReject = (id: string, cropName: string) => {
    updateListingStatus(id, 'Rejected');
    addToast({
      type: 'error',
      title: 'Listing Rejected',
      message: `${cropName} moderation was declined.`,
    });
  };

  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-[#0070f3]" />
          <div>
            <h3 className="text-base font-bold text-[#171717]">Produce Listing Moderation Queue</h3>
            <p className="text-xs text-[#8f8f8f]">Approve quality produce listings before public publication</p>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<CheckCheck className="w-6 h-6" />}
          title="Moderation Queue Clear"
          description="All submitted produce listings have been reviewed."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#ebebeb] text-[11px] font-mono-eyebrow text-[#8f8f8f]">
              <tr>
                <th scope="col" className="px-5 py-3">PRODUCE & FARMER</th>
                <th scope="col" className="px-5 py-3">QUANTITY</th>
                <th scope="col" className="px-5 py-3">ASKING PRICE</th>
                <th scope="col" className="px-5 py-3">STATUS</th>
                <th scope="col" className="px-5 py-3 text-right">MODERATION ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {listings.map((lst) => (
                <tr key={lst.id} className="hover:bg-[#fafafa]/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#171717]">{lst.cropName}</div>
                    <div className="text-xs text-[#8f8f8f]">
                      By {lst.farmerName} • {lst.farmerDistrict} District
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#4d4d4d]">
                    {lst.quantity} Quintals ({lst.qualityGrade})
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#171717]">
                    {formatINR(lst.askingPrice)} / qtl
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={lst.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    {lst.status === 'Pending' ? (
                      <>
                        <SquareButton
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(lst.id, lst.cropName)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </SquareButton>
                        <SquareButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(lst.id, lst.cropName)}
                          icon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </SquareButton>
                      </>
                    ) : (
                      <SquareButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(lst.id, lst.cropName)}
                      >
                        Update Status
                      </SquareButton>
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
