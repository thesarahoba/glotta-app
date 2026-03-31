'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatNaira } from '@/lib/utils';

interface JoinFormProps {
  productId: string;
  productName: string;
  price: number;
}

export function JoinForm({ productId, productName, price }: JoinFormProps) {
  const router = useRouter();
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);

  const totalPrice = price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Join / create wallet
      const res = await fetch('/api/wallets/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: isExisting ? email : name,
          email,
          password,
          phone,
          address,
          quantity,
          isExisting,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong');
        return;
      }

      if (data.alreadyJoined) {
        toast('You already joined this product — logging you in…', { icon: '👋' });
      }

      // 2. Sign in
      const signInRes = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.error) {
        toast.error('Account created but login failed. Please log in manually.');
        router.push('/auth/login');
        return;
      }

      toast.success(data.alreadyJoined ? 'Welcome back!' : 'Wallet created! Start paying when ready.');
      router.push(`/buyer/${data.walletId}`);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">
        {isExisting ? 'Log in to continue' : 'Start your installment plan'}
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {isExisting
          ? `Log in to rejoin ${productName}.`
          : `You'll pay ${formatNaira(totalPrice)} in installments — no interest.`}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isExisting && (
          <Input
            label="Full Name"
            placeholder="Ada Obi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="ada@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder={isExisting ? 'Your password' : 'Create a password (min 6 chars)'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {!isExisting && (
          <>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Delivery Address"
              placeholder="12 Maitama Street, Abuja"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-base font-semibold text-gray-900 w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition flex items-center justify-center"
                >
                  +
                </button>
                {quantity > 1 && (
                  <span className="text-sm text-gray-500 ml-1">
                    Total: <strong className="text-gray-900">{formatNaira(totalPrice)}</strong>
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        <Button type="submit" isLoading={loading} className="w-full mt-2">
          {isExisting ? 'Log In & Continue' : 'Create My Wallet'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setIsExisting((v) => !v)}
        className="w-full text-center text-sm text-brand-600 hover:underline mt-4"
      >
        {isExisting ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
