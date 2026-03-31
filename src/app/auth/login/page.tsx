'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || null;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await signIn('credentials', {
      email: form.email.toLowerCase(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      toast.error('Invalid email or password');
      return;
    }

    toast.success('Welcome back!');

    // Redirect based on role via callbackUrl or fetch session
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      // Fetch session to get role
      const session = await fetch('/api/auth/session').then((r) => r.json());
      const role = session?.user?.role;
      router.push(role === 'SELLER' ? '/dashboard' : '/buyer');
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
      <p className="text-sm text-gray-500 mb-8">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">
          Create one
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          autoComplete="current-password"
        />
        <Button type="submit" isLoading={loading} className="w-full mt-2" size="lg">
          Sign in
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-64 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  );
}
