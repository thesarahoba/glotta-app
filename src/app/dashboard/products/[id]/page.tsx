import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Edit, Users, ExternalLink } from 'lucide-react';
import { formatNaira, calculateProgress } from '@/lib/utils';
import { CopyLinkButton } from '@/components/products/CopyLinkButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      wallets: {
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { wallets: true } },
    },
  });

  if (!product || product.sellerId !== session.user.id) notFound();

  const baseUrl = process.env.NEXTAUTH_URL ?? '';
  const payLink = `${baseUrl}/pay/${session.user.storeSlug}/${product.id}`;

  const totalCollected = product.wallets.reduce((sum, w) => sum + w.amountPaid, 0);
  const activeWallets = product.wallets.filter((w) => w.status === 'ACTIVE').length;
  const completedWallets = product.wallets.filter((w) => w.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> Products
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.planType === 'FIXED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {product.planType}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {product.description && (
              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
            )}
          </div>
          <Link href={`/dashboard/products/${id}/edit`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">
            <Edit size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Payment link */}
      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1.5">Payment Link</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-brand-800 font-mono flex-1 min-w-0 truncate">{payLink}</p>
          <CopyLinkButton payLink={payLink} />
          <Link href={payLink} target="_blank" className="p-1.5 text-brand-600 hover:text-brand-800 transition-colors" title="Open">
            <ExternalLink size={15} />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Full Price" value={formatNaira(product.price)} />
        {product.planType === 'FIXED' && product.installmentAmount && (
          <Stat label={`Per ${product.interval?.toLowerCase()}`} value={formatNaira(product.installmentAmount)} />
        )}
        <Stat label="Total Collected" value={formatNaira(totalCollected)} />
        <Stat label="Buyers" value={`${activeWallets} active · ${completedWallets} done`} />
      </div>

      {/* Buyer wallets */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users size={17} className="text-gray-400" /> Buyers ({product._count.wallets})
          </h2>
        </div>

        {product.wallets.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No buyers yet</p>
            <p className="text-sm text-gray-400 mt-1">Share the payment link to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {product.wallets.map((wallet) => {
              const progress = calculateProgress(wallet.amountPaid, product.price);
              const lastPayment = wallet.payments[0];
              const statusColors: Record<string, string> = {
                ACTIVE: 'bg-blue-50 text-blue-600',
                COMPLETED: 'bg-green-50 text-green-600',
                DEFAULTED: 'bg-red-50 text-red-500',
                PAUSED: 'bg-yellow-50 text-yellow-600',
              };

              return (
                <div key={wallet.id} className="px-4 sm:px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{wallet.buyer.name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[wallet.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {wallet.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{wallet.buyer.email}</p>
                      {lastPayment && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last payment: {formatNaira(lastPayment.amount)} on{' '}
                          {new Date(lastPayment.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatNaira(wallet.amountPaid)}</p>
                      <p className="text-xs text-gray-400">of {formatNaira(product.price)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{progress}% complete</span>
                      <span>{formatNaira(product.price - wallet.amountPaid)} remaining</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 ? '#22c55e' : '#7c3aed',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}
