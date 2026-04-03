'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { MapPin, Phone, Pencil, X, Check } from 'lucide-react';

interface BuyerProfileFormProps {
  initialPhone: string | null;
  initialAddress: string | null;
}

export default function BuyerProfileForm({ initialPhone, initialAddress }: BuyerProfileFormProps) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [address, setAddress] = useState(initialAddress ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch('/api/buyer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, shippingAddress: address || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <div className="px-5 py-4 flex items-center gap-3">
          <Phone size={18} className="text-gray-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-400">Phone Number</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{phone || <span className="text-gray-400 italic">Not set</span>}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          <MapPin size={18} className="text-gray-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-400">Delivery Address</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{address || <span className="text-gray-400 italic">Not set</span>}</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Pencil size={14} /> Edit contact &amp; address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-700">Edit contact &amp; address</p>
      <Input
        id="phone"
        label="Phone number"
        type="tel"
        placeholder="080XXXXXXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <Input
        id="address"
        label="Delivery address"
        type="text"
        placeholder="12 Adeola Street, Lagos"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        hint="Sellers will use this to deliver your orders"
        autoComplete="street-address"
      />
      <div className="flex gap-3">
        <Button onClick={handleSave} isLoading={loading} size="sm" className="flex items-center gap-1.5">
          <Check size={14} /> Save
        </Button>
        <button
          onClick={() => { setEditing(false); setPhone(initialPhone ?? ''); setAddress(initialAddress ?? ''); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}
