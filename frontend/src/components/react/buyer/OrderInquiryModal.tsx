import React, { useState } from 'react';
import type { CropListing, BuyerOrder } from '../../../types';
import { TextInput } from '../ui/TextInput';
import { SquareButton } from '../ui/SquareButton';
import { addOrder } from '../../../stores/orderStore';
import { addToast } from '../../../stores/toastStore';
import { $authSession } from '../../../stores/authStore';
import { t } from '../../../i18n';
import { formatINR } from '../../../lib/utils';
import { X, Send, AlertCircle } from 'lucide-react';

interface Props {
  listing: CropListing;
  onClose: () => void;
}

export const OrderInquiryModal: React.FC<Props> = ({ listing, onClose }) => {
  const session = $authSession.get();
  const user = session.user;
  const lang = user?.preferredLanguage || 'en';

  const [quantity, setQuantity]   = useState('25');
  const [offerPrice, setOffer]    = useState(listing.askingPrice.toString());
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const qty   = parseFloat(quantity)   || 0;
  const price = parseFloat(offerPrice) || 0;
  const total = qty * price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to submit an order inquiry.');
      addToast({ type: 'error', title: 'Authentication Required', message: 'Please sign in to place orders.' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const order: BuyerOrder = {
        id: 'ord_' + Math.random().toString(36).slice(2, 7),
        buyerId:   user.id,
        buyerName: user.name,
        buyerCompany: user.name + ' Sourcing',
        listingId: listing.id,
        cropName:  listing.cropName,
        farmerId:  listing.farmerId,
        farmerName: listing.farmerName,
        requestedQuantity: qty,
        offerPrice: price,
        totalAmount: total,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
      };
      addOrder(order);
      addToast({
        type: 'success',
        title: 'Order submitted',
        message: `Inquiry sent to ${listing.farmerName} for ${qty} qtl of ${listing.cropName}.`,
      });
      setLoading(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-[#ebebeb] rounded-xl max-w-md w-full p-6 shadow-xl animate-zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#ebebeb]">
          <div>
            <h3 className="text-base font-semibold text-[#171717]">Submit order inquiry</h3>
            <p className="text-xs text-[#8f8f8f] mt-0.5">
              {listing.cropName} · {listing.farmerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#8f8f8f] hover:text-[#171717] hover:bg-[#f2f2f2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Produce summary */}
        <div className="bg-[#fafafa] border border-[#ebebeb] rounded-lg p-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8f8f8f]">Asking price</span>
            <span className="font-semibold text-[#171717]">{formatINR(listing.askingPrice)} / qtl</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-[#8f8f8f]">Available</span>
            <span className="font-medium text-[#171717]">{listing.quantity} quintals</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Quantity (quintals)"
            type="number"
            min="1"
            max={listing.quantity.toString()}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            helperText={`Max ${listing.quantity} qtl available`}
            required
          />
          <TextInput
            label="Your offer price (₹ / quintal)"
            type="number"
            value={offerPrice}
            onChange={(e) => setOffer(e.target.value)}
            required
          />
          <div>
            <label className="text-xs font-medium text-[#171717] block mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Delivery requirements, quality notes…"
              className="w-full bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md p-3 focus:outline-none focus:border-[#0070f3]"
            />
          </div>

          {/* Total estimate */}
          <div className="flex items-center justify-between bg-[#fafafa] border border-[#ebebeb] rounded-lg px-4 py-3">
            <span className="text-xs text-[#8f8f8f]">
              {qty} qtl × {formatINR(price)}
            </span>
            <span className="text-base font-semibold text-[#171717]">{formatINR(total)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <SquareButton type="button" variant="ghost" className="flex-1" onClick={onClose}>
              {t('common.cancel', lang)}
            </SquareButton>
            <SquareButton
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              {loading ? 'Sending…' : 'Send inquiry'}
            </SquareButton>
          </div>
        </form>
      </div>
    </div>
  );
};
