'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatNaira } from '@/lib/utils';
import { CreditCard, Loader2 } from 'lucide-react';

// Extend window for Paystack inline JS
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

interface PayButtonProps {
  walletId: string;
  balance: number;
  planType: 'FIXED' | 'FLEXIBLE';
  installmentAmount?: number | null;
}

export function PayButton({ walletId, balance, planType, installmentAmount }: PayButtonProps) {
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  // Load Paystack inline script
  useEffect(() => {
    if (document.getElementById('paystack-inline')) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paystack-inline';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  const getAmount = () => {
    if (planType === 'FIXED' && installmentAmount) {
      return Math.min(installmentAmount, balance);
    }
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) ? 0 : Math.min(parsed, balance);
  };

  const handlePay = async () => {
    const amount = getAmount();
    if (amount < 100) {
      toast.error('Minimum payment is ₦100');
      return;
    }
    if (!scriptLoaded || !window.PaystackPop) {
      toast.error('Payment system not ready. Please refresh.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create pending payment record & get reference
      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, amount }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        toast.error(initData.error ?? 'Could not initiate payment');
        return;
      }

      const { reference, email, amount: amountKobo, publicKey } = initData;

      // 2. Open Paystack popup
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: amountKobo,
        ref: reference,
        onClose: () => {
          setLoading(false);
          toast('Payment cancelled.', { icon: '👋' });
        },
        callback: async (response) => {
          // 3. Verify server-side
          try {
            const verRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference }),
            });

            const verData = await verRes.json();
            if (verRes.ok) {
              toast.success('Payment confirmed! 🎉');
              router.refresh();
            } else {
              toast.error(verData.error ?? 'Verification failed');
            }
          } catch {
            toast.error('Could not verify payment. Please contact support if charged.');
          } finally {
            setLoading(false);
          }
        },
      });

      handler.openIframe();
    } catch {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const amount = getAmount();

  return (
    <div className="space-y-3">
      {planType === 'FLEXIBLE' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Enter amount <span className="text-gray-400 font-normal">(max {formatNaira(balance)})</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
            <input
              type="number"
              min="100"
              max={balance}
              step="100"
              placeholder="e.g. 5000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 transition"
            />
          </div>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || !scriptLoaded || amount < 100}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processing…</>
        ) : (
          <><CreditCard size={16} /> Pay {amount >= 100 ? formatNaira(amount) : ''} Now</>
        )}
      </button>

      {planType === 'FIXED' && installmentAmount && (
        <p className="text-xs text-center text-gray-400">
          Installment: {formatNaira(Math.min(installmentAmount, balance))} · powered by Paystack
        </p>
      )}
    </div>
  );
}
