'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Role = 'SELLER' | 'BUYER';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role')?.toUpperCase() as Role) || 'SELLER';

  const [role, setRole] = useState<Role>(defaultRole);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    phone: '',
    shippingAddress: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (role === 'SELLER' && (!form.storeName || form.storeName.length < 2))
      e.storeName = 'Store name must be at least 2 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email.toLowerCase(),
          password: form.password,
          role,
          ...(role === 'SELLER' && { storeName: form.storeName }),
          ...(form.phone && { phone: form.phone }),
          ...(role === 'BUYER' && form.shippingAddress && { shippingAddress: form.shippingAddress }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInRes = await signIn('credentials', {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.success('Account created! Please sign in.');
        router.push('/auth/login');
      } else {
        toast.success('Welcome to Glotta!');
        router.push(role === 'SELLER' ? '/dashboard' : '/buyer');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>

      {/* Role toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        {(['SELLER', 'BUYER'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === r
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {r === 'SELLER' ? '🛍️ I sell products' : '🛒 I want to buy'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full name"
          type="text"
          placeholder="Ada Okonkwo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          autoComplete="name"
        />
        {role === 'SELLER' && (
          <Input
            id="storeName"
            label="Store name"
            type="text"
            placeholder="Kiki Hair Store"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            error={errors.storeName}
            hint="This becomes your public storefront name"
          />
        )}
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          id="phone"
          label="Phone number (optional)"
          type="tel"
          placeholder="080XXXXXXXX"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          autoComplete="tel"
        />
        {role === 'BUYER' && (
          <Input
            id="shippingAddress"
            label="Delivery address"
            type="text"
            placeholder="12 Adeola Street, Lagos"
            value={form.shippingAddress}
            onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
            hint="Where should sellers send your orders?"
            autoComplete="street-address"
          />
        )}
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          autoComplete="new-password"
        />
        <Button type="submit" isLoading={loading} className="w-full mt-2" size="lg">
          {role === 'SELLER' ? 'Create seller account' : 'Create account'}
        </Button>
      </form>

      <p className="text-xs text-center text-gray-400 mt-4">
        By registering you agree to our Terms of Service.
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-64 animate-pulse" />}>
      <RegisterForm />
    </Suspense>
  );
}
