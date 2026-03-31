import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatNaira } from '@/lib/utils';
import { Wallet, CheckCircle2, Clock, Star } from 'lucide-react';

export default async function BuyerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const wallets = await prisma.wallet.findMany({
    where: { buyerId: session.user.id },
    include: { product: { include: { seller: { select: { storeName: true } } } } },
    orderBy: { updatedAt: 'desc' },
  });

  const totalPaid = wallets.reduce((sum, w) => sum + w.amountPaid, 0);
  const totalPoints = wallets.reduce((sum, w) => sum + w.points, 0);
  const completedCount = wallets.filter((w) => w.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <span className="text-lg font-bold text-brand-700">glotta</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wallets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hi {session.user.name?.split(' ')[0]} 👋 — {wallets.length} plan{wallets.length !== 1 ? 's' : ''}</p>
        </div>

        {wallets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 text-center">
              <p className="text-[11px] text-gray-400 mb-0.5">Total Paid</p>
              <p className="text-sm font-bold text-gray-900">{formatNaira(totalPaid)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 text-center">
              <p className="text-[11px] text-gray-400 mb-0.5">Completed</p>
              <p className="text-sm font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-brand-50 rounded-2xl border border-brand-100 shadow-sm px-3 py-3 text-center">
              <p className="text-[11px] text-brand-500 mb-0.5 flex items-center justify-center gap-0.5">
                <Star size={10} className="fill-brand-400 text-brand-400" />
                Points
              </p>
              <p className="text-sm font-bold text-brand-700">{totalPoints}</p>
            </div>
          </div>
        )}

        {wallets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-14 text-center shadow-sm">
            <Wallet size={44} className="mx-auto text-gray-300 mb-4" />
            <p className="font-semibold text-gray-700">No installment plans yet</p>
            <p className="text-sm text-gray-400 mt-1">Ask a seller to share their payment link with you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => {
              const progress = Math.min(100, Math.round((wallet.amountPaid / wallet.totalPrice) * 100));
              const isComplete = wallet.status === 'COMPLETED';
              return (
                <Link key={wallet.id} href={`/buyer/${wallet.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide">{wallet.product.seller.storeName}</p>
                      <p className="font-semibold text-gray-900 mt-0.5 truncate">{wallet.product.name}</p>
                    </div>
                    {isComplete ? (
                      <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    ) : (
                      <Clock size={18} className="text-brand-400 shrink-0" />
                    )}
                  </div>

                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: isComplete ? '#22c55e' : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>{formatNaira(wallet.amountPaid)} paid</span>
                    <span>{progress}% · {formatNaira(wallet.balance)} left</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
