import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatNaira } from '@/lib/utils';
import { Wallet, CheckCircle2, Clock, Star, TrendingUp, Package, ChevronRight } from 'lucide-react';
import { FilterTabs } from './FilterTabs';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function BuyerPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const { tab } = await searchParams;
  const filter = tab === 'active' ? 'active' : tab === 'completed' ? 'completed' : 'all';

  // Filtered wallets for the list
  const wallets = await prisma.wallet.findMany({
    where: {
      buyerId: session.user.id,
      ...(filter === 'active'
        ? { status: 'ACTIVE' }
        : filter === 'completed'
        ? { status: 'COMPLETED' }
        : {}),
    },
    include: { product: { include: { seller: { select: { storeName: true } } } } },
    orderBy: { updatedAt: 'desc' },
  });

  // All wallets for stats
  const allWallets = await prisma.wallet.findMany({
    where: { buyerId: session.user.id },
    select: { amountPaid: true, balance: true, status: true, points: true },
  });

  const totalPaid = allWallets.reduce((s, w) => s + w.amountPaid, 0);
  const totalPoints = allWallets.reduce((s, w) => s + w.points, 0);
  const completedCount = allWallets.filter((w) => w.status === 'COMPLETED').length;
  const activeCount = allWallets.filter((w) => w.status === 'ACTIVE').length;
  const totalRemaining = allWallets
    .filter((w) => w.status === 'ACTIVE')
    .reduce((s, w) => s + w.balance, 0);

  const firstName = session.user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-brand-700">glotta</span>
            <p className="text-[11px] text-gray-400 leading-none mt-0.5">My Dashboard</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">
              {firstName[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            {allWallets.length === 0
              ? 'Start your first installment plan below'
              : `You have ${allWallets.length} plan${allWallets.length !== 1 ? 's' : ''} in total`}
          </p>
        </div>

        {/* Stats */}
        {allWallets.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} className="text-brand-500" />
                <p className="text-xs text-gray-400 font-medium">Total Paid</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatNaira(totalPaid)}</p>
              <p className="text-xs text-gray-400 mt-1">
                across {allWallets.length} plan{allWallets.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={15} className="text-blue-500" />
                <p className="text-xs text-gray-400 font-medium">Outstanding</p>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatNaira(totalRemaining)}</p>
              <p className="text-xs text-gray-400 mt-1">
                on {activeCount} active plan{activeCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-green-500" />
                <p className="text-xs text-gray-400 font-medium">Completed</p>
              </div>
              <p className="text-xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-gray-400 mt-1">
                payment plan{completedCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-brand-50 rounded-2xl border border-brand-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={15} className="text-brand-500 fill-brand-400" />
                <p className="text-xs text-brand-500 font-medium">Points</p>
              </div>
              <p className="text-xl font-bold text-brand-700">{totalPoints}</p>
              <p className="text-xs text-brand-400 mt-1">loyalty rewards</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {allWallets.length > 0 && (
          <FilterTabs
            current={filter}
            counts={{ all: allWallets.length, active: activeCount, completed: completedCount }}
          />
        )}

        {/* Wallet list */}
        {wallets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-14 text-center shadow-sm">
            <Wallet size={44} className="mx-auto text-gray-300 mb-4" />
            <p className="font-semibold text-gray-700">
              {filter === 'all' ? 'No installment plans yet' : `No ${filter} plans`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all'
                ? 'Ask a seller to share their payment link with you.'
                : 'Switch to "All" to see everything.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              {filter === 'all' ? 'All Plans' : filter === 'active' ? 'Active Plans' : 'Completed Plans'}{' '}
              ({wallets.length})
            </p>
            {wallets.map((wallet) => {
              const progress = Math.min(
                100,
                Math.round((wallet.amountPaid / wallet.totalPrice) * 100),
              );
              const isComplete = wallet.status === 'COMPLETED';
              return (
                <Link
                  key={wallet.id}
                  href={`/buyer/${wallet.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-brand-100 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide">
                        {wallet.product.seller.storeName}
                      </p>
                      <p className="font-bold text-gray-900 mt-0.5 truncate text-base">
                        {wallet.product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={11} /> Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                          <Clock size={11} /> Active
                        </span>
                      )}
                      <ChevronRight
                        size={16}
                        className="text-gray-300 group-hover:text-brand-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: isComplete
                          ? '#22c55e'
                          : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                      }}
                    />
                  </div>

                  {/* Amounts row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{formatNaira(wallet.amountPaid)} paid</span>
                      {!isComplete && (
                        <span className="text-brand-600 font-semibold">
                          {formatNaira(wallet.balance)} left
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        isComplete ? 'text-green-600' : 'text-brand-600'
                      }`}
                    >
                      {progress}%
                    </span>
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
