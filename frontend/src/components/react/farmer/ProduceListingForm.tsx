import React, { useState } from 'react';
import type { CropRecommendation, CropListing } from '../../../types';
import { TextInput } from '../ui/TextInput';
import { SquareButton } from '../ui/SquareButton';
import { addListing } from '../../../stores/marketplaceStore';
import { addToast } from '../../../stores/toastStore';
import { $authSession } from '../../../stores/authStore';
import { $farmProfile } from '../../../stores/farmStore';
import { t } from '../../../i18n';
import { Send, AlertCircle, ArrowLeft } from 'lucide-react';

interface ProduceListingFormProps {
  initialCrop?: CropRecommendation | null;
  prefillCropName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const ProduceListingForm: React.FC<ProduceListingFormProps> = ({
  initialCrop,
  prefillCropName,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const session = $authSession.get();
  const user = session.user;
  const lang = user?.preferredLanguage || 'en';

  const [cropName, setCropName] = useState(prefillCropName || initialCrop?.cropName || '');
  const [category, setCategory] = useState(initialCrop?.category || 'Vegetables');
  const [quantity, setQuantity] = useState('100');
  const [askingPrice, setAskingPrice] = useState('3200');
  const [qualityGrade, setQualityGrade] = useState<'Grade A' | 'Grade B' | 'Grade C' | 'Organic Certified'>('Grade A');
  const [harvestDate, setHarvestDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to post a listing.');
      addToast({ type: 'error', title: 'Authentication Required', message: 'Please sign in to publish produce.' });
      return;
    }

    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(askingPrice);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Asking price must be greater than 0.');
      return;
    }

    setSubmitting(true);

    const farmProfile = $farmProfile.get();

    const newListing: CropListing = {
      id: `lst_${Date.now()}`,
      farmerId: user.id,
      farmerName: user.name,
      farmerDistrict: user.district || farmProfile?.district || 'Mandya',
      farmerState: user.state || farmProfile?.state || 'Karnataka',
      farmerPhone: user.phone || '9876543210',
      farmerVerified: true,
      cropName: cropName.trim(),
      category: category.trim(),
      quantity: qtyNum,
      unit: 'quintals',
      harvestDate: harvestDate || new Date().toISOString().split('T')[0],
      askingPrice: priceNum,
      qualityGrade,
      status: 'Active',
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addListing(newListing);
    addToast({
      type: 'success',
      title: 'Listing Created',
      message: `${newListing.cropName} (${newListing.quantity} qtl) is now live on the marketplace.`,
    });

    setSubmitting(false);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <TextInput
        label="Crop / Produce Name"
        placeholder="e.g. Organic Tomatoes, Ragi GPU 28"
        value={cropName}
        onChange={(e) => setCropName(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[#171717] block mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 bg-white border border-[#ebebeb] text-[#171717] text-xs rounded-md px-3 focus:outline-none focus:border-[#0070f3]"
          >
            <option value="Vegetables">Vegetables</option>
            <option value="Cereals">Cereals</option>
            <option value="Millets">Millets</option>
            <option value="Pulses">Pulses</option>
            <option value="Oilseeds">Oilseeds</option>
            <option value="Fruits">Fruits</option>
            <option value="Spices">Spices</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#171717] block mb-1">Quality Grade</label>
          <select
            value={qualityGrade}
            onChange={(e) => setQualityGrade(e.target.value as any)}
            className="w-full h-10 bg-white border border-[#ebebeb] text-[#171717] text-xs rounded-md px-3 focus:outline-none focus:border-[#0070f3]"
          >
            <option value="Grade A">Grade A (Premium)</option>
            <option value="Grade B">Grade B (Standard)</option>
            <option value="Grade C">Grade C (Fair)</option>
            <option value="Organic Certified">Organic Certified</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Quantity (Quintals)"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <TextInput
          label="Asking Price (₹ / Quintal)"
          type="number"
          min="100"
          value={askingPrice}
          onChange={(e) => setAskingPrice(e.target.value)}
          required
        />
      </div>

      <TextInput
        label="Expected Harvest / Available Date"
        type="date"
        value={harvestDate}
        onChange={(e) => setHarvestDate(e.target.value)}
      />

      <div>
        <label className="text-xs font-medium text-[#171717] block mb-1">Description / Notes</label>
        <textarea
          rows={2}
          placeholder="Add details about crop variety, farming methods, or pickup terms..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white border border-[#ebebeb] text-[#171717] text-xs rounded-md p-3 focus:outline-none focus:border-[#0070f3]"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebebeb]">
        {!isModal && (
          <a href="/farmer/listings">
            <SquareButton type="button" variant="ghost" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Listings
            </SquareButton>
          </a>
        )}
        {onCancel && (
          <SquareButton type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </SquareButton>
        )}
        <SquareButton type="submit" variant="primary" disabled={submitting} icon={<Send className="w-3.5 h-3.5" />}>
          {submitting ? 'Publishing...' : 'Publish Listing'}
        </SquareButton>
      </div>
    </form>
  );
};
