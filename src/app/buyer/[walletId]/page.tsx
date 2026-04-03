import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { formatNaira } from '@/lib/utils';
import { Clock, Wallet, ChevronRight, Star, Trophy } from 'lucide-react';
import { PayButton } from '@/components/buyer/PayButton';
import { ConfettiBurst } from '@/components/buyer/ConfettiBurst';

interface PageProps {
  params: Promise<{ walletId: string }>;
}

export default async function WalletPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      product: {
        include: {
          seller: { select: { storeName: true, storeSlug: true } },
        },
      },
      payments: {
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wallet || wallet.buyerId !== session.user.id) notFound();

  const { product } = wallet;
  const progress = Math.min(100, Math.round((wallet.amountPaid / wallet.totalPrice) * 100));
  const isComplete = wallet.status === 'COMPLETED';

  const intervalLabel: Record<string, string> = {
    DAILY: 'day',
    WEEKLY: 'week',
    MONTHLY: 'month',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-700">glotta</span>
          <Link href="/buyer" className="text-sm text-gray-500 hover:text-gray-700 font-medium">My Wallets</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Confetti burst on completion */}
        {isComplete && <ConfettiBurst />}

        {/* Status badge */}
        {isComplete && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl px-5 py-5 text-center shadow-sm">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-green-800 text-lg">Payment Complete!</p>
            <p className="text-sm text-green-600 mt-1">You've paid in full. The seller will process your order.</p>
            {wallet.points > 0 && (
              <p className="text-xs text-brand-600 font-semibold mt-2">⭐ You earned {wallet.points} loyalty points on this plan</p>
            )}
          </div>
        )}

        {/* Product info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">
            {product.seller.storeName}
          </p>
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-gray-400 mt-1">{product.description}</p>
          )}

          {wallet.quantity > 1 && (
            <p className="text-sm text-gray-500 mt-2">Qty: {wallet.quantity}</p>
          )}
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet size={17} className="text-brand-500" /> Payment Progress
            </h2>
            <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-brand-600'}`}>
              {progress}%
            </span>
          </div>

          {/* Big progress bar */}
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: isComplete
                  ? '#22c55e'
                  : 'linear-gradient(90deg, #7c3aed, #a855f7)',
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Paid</p>
              <p className="text-sm font-bold text-gray-900">{formatNaira(wallet.amountPaid)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
              <p className="text-sm font-bold text-gray-900">{formatNaira(wallet.balance)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Total</p>
              <p className="text-sm font-bold text-gray-900">{formatNaira(wallet.totalPrice)}</p>
            </div>
          </div>

          {product.planType === 'FIXED' && product.installmentAmount && !isComplete && (
            <div className="bg-brand-50 rounded-xl px-4 py-2.5 text-sm text-brand-800 flex items-center gap-2">
              <Clock size={14} className="shrink-0" />
              Next payment: <strong>{formatNaira(product.installmentAmount)}</strong> per {intervalLabel[product.interval ?? ''] ?? 'period'}
            </div>
          )}

          {!isComplete && (
            <PayButton
              walletId={wallet.id}
              balance={wallet.balance}
              planType={product.planType as 'FIXED' | 'FLEXIBLE'}
              installmentAmount={product.installmentAmount}
              allowOverpay={product.allowOverpay}
              allowUnderpay={product.allowUnderpay}
              paystackKey={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''}
            />
          )}
        </div>

        {/* Gamification milestone callout */}
        {!isComplete && progress >= 50 && (
          <div className={`rounded-2xl border px-5 py-4 flex items-center gap-3 ${
            progress >= 90
              ? 'bg-amber-50 border-amber-100'
              : progress >= 75
              ? 'bg-purple-50 border-purple-100'
              : 'bg-blue-50 border-blue-100'
          }`}>
            <Trophy size={20} className={
              progress >= 90 ? 'text-amber-500 shrink-0' :
              progress >= 75 ? 'text-brand-500 shrink-0' : 'text-blue-500 shrink-0'
            } />
            <p className={`text-sm font-medium ${
              progress >= 90 ? 'text-amber-800' :
              progress >= 75 ? 'text-brand-800' : 'text-blue-800'
            }`}>
              {progress >= 90
                ? "Almost done! Just a little more to go 💪"
                : progress >= 75
                ? "Great progress! You're 75% of the way there 🔥"
                : "Halfway there! Keep it up 🎯"}
            </p>
          </div>
        )}

        {/* Points card */}
        {wallet.points > 0 && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star size={20} className="text-brand-500 fill-brand-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand-900">Loyalty Points</p>
                <p className="text-xs text-brand-500 mt-0.5">Earned from your payments on this plan</p>
              </div>
            </div>
            <span className="text-xl font-bold text-brand-700">{wallet.points}</span>
          </div>
        )}

        {/* Payment history */}
        {wallet.payments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Payment History ({wallet.payments.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {wallet.payments.map((payment) => (
                <div key={payment.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatNaira(payment.amount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(payment.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600">
                    Paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {wallet.payments.length === 0 && !isComplete && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-8 text-center">
            <Clock size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No payments yet</p>
            <p className="text-xs text-gray-400 mt-1">Your payment history will appear here.</p>
          </div>
        )}

        {/* Back to seller store */}
        <Link
          href={`/pay/${product.seller.storeSlug}/${product.id}`}
          className="flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 bg-white rounded-2xl border border-gray-100 px-5 py-3.5 shadow-sm"
        >
          <span>View product page</span>
          <ChevronRight size={16} />
        </Link>
      </main>
    </div>
  );
}
