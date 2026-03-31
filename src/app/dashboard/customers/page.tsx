import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatNaira } from '@/lib/utils';
import { Users, Package } from 'lucide-react';

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  // All wallets for this seller's products, ordered newest first
  const wallets = await prisma.wallet.findMany({
    where: { product: { sellerId: session.user.id } },
    include: {
      buyer: { select: { id: true, name: true, email: true, phone: true } },
      product: { select: { id: true, name: true, price: true } },
      payments: { where: { status: 'SUCCESS' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-blue-50 text-blue-600',
    COMPLETED: 'bg-green-50 text-green-600',
    DEFAULTED: 'bg-red-50 text-red-500',
    PAUSED: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} across all products</p>
      </div>

      {wallets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-gray-700 text-lg">No customers yet</p>
          <p className="text-sm text-gray-400 mt-1">Share your product links to get your first buyer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_140px_120px_100px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>Customer</span>
            <span>Product</span>
            <span>Progress</span>
            <span>Paid / Total</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-gray-50">
            {wallets.map((wallet) => {
              const progress = Math.min(100, Math.round((wallet.amountPaid / wallet.totalPrice) * 100));
              const lastPayment = wallet.payments[0];
              return (
                <Link
                  key={wallet.id}
                  href={`/dashboard/products/${wallet.product.id}`}
                  className="grid sm:grid-cols-[1fr_1fr_140px_120px_100px] gap-4 items-center px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Customer */}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{wallet.buyer.name}</p>
                    <p className="text-xs text-gray-400 truncate">{wallet.buyer.email}</p>
                    {wallet.buyer.phone && (
                      <p className="text-xs text-gray-400">{wallet.buyer.phone}</p>
                    )}
                  </div>

                  {/* Product + inline mobile stats */}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 font-medium truncate flex items-center gap-1.5">
                      <Package size={13} className="text-gray-400 shrink-0" />
                      {wallet.product.name}
                    </p>
                    {lastPayment && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last: {new Date(lastPayment.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {/* Mobile-only summary row */}
                    <div className="sm:hidden mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700">{formatNaira(wallet.amountPaid)}<span className="font-normal text-gray-400"> / {formatNaira(wallet.totalPrice)}</span></span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[wallet.status] ?? 'bg-gray-100 text-gray-400'}`}>{wallet.status}</span>
                      <span className="text-[10px] text-gray-400">{progress}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="hidden sm:block">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 ? '#22c55e' : '#7c3aed',
                        }}
                      />
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">{formatNaira(wallet.amountPaid)}</p>
                    <p className="text-xs text-gray-400">{formatNaira(wallet.totalPrice)}</p>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[wallet.status] ?? 'bg-gray-100 text-gray-400'}`}>
                      {wallet.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
