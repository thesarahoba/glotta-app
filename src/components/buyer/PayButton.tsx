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
      }) => { openIframe: () => void } | null;
    };
  }
}

interface PayButtonProps {
  walletId: string;
  balance: number;
  planType: 'FIXED' | 'FLEXIBLE';
  installmentAmount?: number | null;
  allowOverpay?: boolean;
  allowUnderpay?: boolean;
  paystackKey: string;
}

export function PayButton({ walletId, balance, planType, installmentAmount, allowOverpay = true, allowUnderpay = false, paystackKey }: PayButtonProps) {
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
    script.onerror = () => console.error('[paystack] Failed to load inline.js');
    document.body.appendChild(script);
  }, []);

  // For FIXED plans: whether the buyer can change the amount at all
  const fixedDefault = planType === 'FIXED' && installmentAmount
    ? Math.min(installmentAmount, balance)
    : 0;
  const fixedIsFlexible = planType === 'FIXED' && (allowOverpay || allowUnderpay);

  const getAmount = () => {
    if (planType === 'FIXED' && installmentAmount) {
      if (!fixedIsFlexible) return fixedDefault;
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? fixedDefault : Math.min(parsed, balance);
    }
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) ? 0 : Math.min(parsed, balance);
  };

  const minAmount = planType === 'FIXED' && installmentAmount && !allowUnderpay
    ? Math.min(installmentAmount, balance)
    : 100;

  const maxAmount = planType === 'FIXED' && installmentAmount && !allowOverpay
    ? Math.min(installmentAmount, balance)
    : balance;

  const handlePay = async () => {
    const amount = getAmount();
    if (amount < 100) {
      toast.error('Minimum payment is ₦100');
      return;
    }

    if (planType === 'FIXED' && installmentAmount && !allowUnderpay && amount < Math.min(installmentAmount, balance)) {
      toast.error(`Minimum payment is ${formatNaira(Math.min(installmentAmount, balance))}`);
      return;
    }

    if (!paystackKey) {
      toast.error('Payment not configured. Please contact support.');
      return;
    }

    if (!scriptLoaded || !window.PaystackPop) {
      toast.error('Payment system not ready. Please refresh.');
      return;
    }

    setLoading(true);

    // Step 1: Create a pending payment record and get the reference
    let reference: string;
    let email: string;
    let amountKobo: number;

    try {
      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, amount }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        toast.error(initData.error ?? 'Could not initiate payment');
        setLoading(false);
        return;
      }

      reference = initData.reference;
      email = initData.email;
      amountKobo = initData.amount; // already in kobo
    } catch (err) {
      console.error('[paystack] initiate error:', err);
      toast.error('Network error. Check your connection and try again.');
      setLoading(false);
      return;
    }

    // Step 2: Open Paystack popup
    // NOTE: callback must be synchronous — Paystack v1 does not await Promises
    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email,
        amount: amountKobo,
        ref: reference,
        onClose: () => {
          setLoading(false);
          toast('Payment cancelled.', { icon: '👋' });
        },
        callback: (response) => {
          // Step 3: Verify server-side (sync callback → use .then chains)
          fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference }),
          })
            .then((res) => res.json().then((data) => ({ res, data })))
            .then(({ res, data }) => {
              if (res.ok) {
                toast.success('Payment confirmed! 🎉');
                router.refresh();
              } else {
                toast.error(data.error ?? 'Verification failed');
              }
            })
            .catch(() => {
              toast.error('Could not verify payment. Contact support if you were charged.');
            })
            .finally(() => {
              setLoading(false);
            });
        },
      });

      if (!handler) {
        throw new Error('Paystack returned no handler — key may be invalid');
      }

      handler.openIframe();
    } catch (err) {
      console.error('[paystack] setup/openIframe error:', err);
      toast.error('Could not open payment popup. Please refresh and try again.');
      setLoading(false);
    }
  };

  const amount = getAmount();

  return (
    <div className="space-y-3">
      {(planType === 'FLEXIBLE' || fixedIsFlexible) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {planType === 'FIXED' ? (
              <>Amount <span className="text-gray-400 font-normal">(min {formatNaira(minAmount)}{allowOverpay && balance > minAmount ? `, max ${formatNaira(balance)}` : ''})</span></>
            ) : (
              <>Enter amount <span className="text-gray-400 font-normal">(max {formatNaira(balance)})</span></>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
            <input
              type="number"
              min={minAmount}
              max={maxAmount}
              step="100"
              placeholder={planType === 'FIXED' ? formatNaira(fixedDefault).replace('₦','') : 'e.g. 5000'}
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
