'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import { Info } from 'lucide-react';

type PlanType = 'FIXED' | 'FLEXIBLE';
type Interval = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface ProductFormProps {
  productId?: string;
  defaultValues?: {
    name: string;
    description: string;
    price: number;
    planType: PlanType;
    installmentAmount?: number | null;
    interval?: Interval | null;
    durationCount?: number | null;
    lockFunds?: boolean;
    isActive?: boolean;
    imageUrl?: string | null;
  };
  mode: 'create' | 'edit';
}

export function ProductForm({ productId, defaultValues, mode }: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(defaultValues?.name ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [price, setPrice] = useState(defaultValues?.price?.toString() ?? '');
  const [planType, setPlanType] = useState<PlanType>(defaultValues?.planType ?? 'FIXED');
  const [installmentAmount, setInstallmentAmount] = useState(defaultValues?.installmentAmount?.toString() ?? '');
  const [interval, setInterval] = useState<Interval>(defaultValues?.interval ?? 'WEEKLY');
  const [durationCount, setDurationCount] = useState(defaultValues?.durationCount?.toString() ?? '');
  const [lockFunds, setLockFunds] = useState(defaultValues?.lockFunds ?? false);
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(defaultValues?.imageUrl ?? '');
  const [loading, setLoading] = useState(false);

  const priceNum = parseFloat(price);
  const installmentNum = parseFloat(installmentAmount);
  const durNum = parseInt(durationCount);

  const expectedTotal =
    planType === 'FIXED' && installmentNum > 0 && durNum > 0
      ? installmentNum * durNum
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      planType,
      lockFunds,
      isActive,
      ...(imageUrl ? { imageUrl } : {}),
    };

    if (planType === 'FIXED') {
      body.installmentAmount = installmentNum;
      body.interval = interval;
      body.durationCount = durNum;
    }

    try {
      const res = await fetch(
        mode === 'create' ? '/api/products' : `/api/products/${productId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong');
        return;
      }

      toast.success(mode === 'create' ? 'Product created!' : 'Product updated!');
      router.push(`/dashboard/products/${data.id ?? productId}`);
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Product Details</h2>

        <Input
          label="Product Name"
          placeholder="e.g. Samsung Galaxy A54"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 placeholder-gray-400 resize-none transition"
            rows={3}
            placeholder="Brief description of the product…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Input
          label="Full Price (₦)"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g. 150000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <ImageUpload value={imageUrl} onChange={setImageUrl} disabled={loading} />
      </div>

      {/* Payment Plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Payment Plan</h2>

        <div className="flex gap-3">
          {(['FIXED', 'FLEXIBLE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPlanType(type)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                planType === type
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {type === 'FIXED' ? '📅 Fixed Schedule' : '🔄 Flexible'}
            </button>
          ))}
        </div>

        {planType === 'FIXED' ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 flex items-start gap-1.5">
              <Info size={13} className="mt-0.5 shrink-0" />
              Buyer pays a set amount on a recurring schedule until the full price is covered.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Installment Amount (₦)"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 5000"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as Interval)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 bg-white transition"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </div>

            <Input
              label="Number of Payments"
              type="number"
              min="1"
              placeholder="e.g. 12"
              value={durationCount}
              onChange={(e) => setDurationCount(e.target.value)}
              required
              hint={expectedTotal ? `Total collected: ₦${expectedTotal.toLocaleString()}` : undefined}
            />
          </div>
        ) : (
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 shrink-0" />
            Buyer can pay any amount at any time until the full price is reached.
          </p>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Settings</h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            checked={lockFunds}
            onChange={(e) => setLockFunds(e.target.checked)}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Lock funds until complete</p>
            <p className="text-xs text-gray-400">Funds will only be released to you once the buyer pays in full.</p>
          </div>
        </label>

        {mode === 'edit' && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Product is active</p>
              <p className="text-xs text-gray-400">Inactive products cannot accept new buyers.</p>
            </div>
          </label>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={loading} className="px-8">
          {mode === 'create' ? 'Create Product' : 'Save Changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
