import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatNaira } from '@/lib/utils';
import { Wallet, ShieldCheck, Info } from 'lucide-react';

export default async function WithdrawPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  // Withdrawable = sum of amountPaid on COMPLETED wallets for this seller
  const completedWallets = await prisma.wallet.findMany({
    where: {
      product: { sellerId: session.user.id },
      status: 'COMPLETED',
    },
    select: { amountPaid: true },
  });

  // Active wallets (locked until complete)
  const activeWallets = await prisma.wallet.findMany({
    where: {
      product: { sellerId: session.user.id },
      status: 'ACTIVE',
    },
    select: { amountPaid: true, product: { select: { lockFunds: true } } },
  });

  const withdrawable = completedWallets.reduce((sum, w) => sum + w.amountPaid, 0);
  const locked = activeWallets
    .filter((w) => w.product.lockFunds)
    .reduce((sum, w) => sum + w.amountPaid, 0);
  const unlocked = activeWallets
    .filter((w) => !w.product.lockFunds)
    .reduce((sum, w) => sum + w.amountPaid, 0);

  const totalAvailable = withdrawable + unlocked;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdraw Funds</h1>
        <p className="text-sm text-gray-500 mt-0.5">Move your collected funds to your bank account.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 rounded-2xl border border-green-100 p-3 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs text-green-600 font-semibold mb-1">Available</p>
          <p className="text-sm sm:text-lg font-bold text-green-700 truncate">{formatNaira(totalAvailable)}</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-3 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs text-yellow-600 font-semibold mb-1">Locked</p>
          <p className="text-sm sm:text-lg font-bold text-yellow-700 truncate">{formatNaira(locked)}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 sm:p-4 text-center">
          <p className="text-[11px] sm:text-xs text-gray-500 font-semibold mb-1">Completed</p>
          <p className="text-sm sm:text-lg font-bold text-gray-700 truncate">{formatNaira(withdrawable)}</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4 flex gap-3">
        <Info size={17} className="text-brand-600 shrink-0 mt-0.5" />
        <div className="text-sm text-brand-800 space-y-1">
          <p><strong>Locked funds</strong> are from active wallets where you enabled "Lock funds until complete". They'll become available when buyers finish paying.</p>
          <p><strong>Available funds</strong> include all completed orders plus any active wallets where lock is off.</p>
        </div>
      </div>

      {/* Withdraw form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Wallet size={17} className="text-brand-500" /> Request Withdrawal
        </h2>

        {totalAvailable < 100 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 font-medium">No funds available to withdraw</p>
            <p className="text-sm text-gray-400 mt-1">Funds become available once buyers complete their payments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₦</span>
                <input
                  type="number"
                  min="100"
                  max={totalAvailable}
                  defaultValue={totalAvailable}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Max: {formatNaira(totalAvailable)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
              <input
                type="text"
                placeholder="Account Number"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 transition mb-2"
              />
              <input
                type="text"
                placeholder="Bank Name (e.g. GTBank)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 transition mb-2"
              />
              <input
                type="text"
                placeholder="Account Name"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-sm text-gray-900 transition"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <ShieldCheck size={15} className="text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-800">
                <strong>Coming in a future release.</strong> Withdrawal via Paystack Transfer API will be enabled after KYC verification is complete. Your balance is safe.
              </p>
            </div>

            <button
              disabled
              className="w-full bg-gray-200 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
            >
              Request Withdrawal (Coming Soon)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
