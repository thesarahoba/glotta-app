import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatNaira } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, Clock, ArrowRight, PackageOpen } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seller = await prisma.user.findUnique({
    where: { storeSlug: slug },
    select: { storeName: true, storeDesc: true },
  });
  if (!seller) return { title: 'Store not found' };

  return {
    title: `${seller.storeName} — Installment Plans on Glotta`,
    description: seller.storeDesc ?? `Browse installment plans from ${seller.storeName} on Glotta.`,
    openGraph: {
      title: `${seller.storeName} on Glotta`,
      description: seller.storeDesc ?? `Browse installment plans from ${seller.storeName}.`,
      type: 'website',
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;

  const seller = await prisma.user.findUnique({
    where: { storeSlug: slug },
    select: {
      name: true,
      storeName: true,
      storeDesc: true,
      storeLogo: true,
      storeSlug: true,
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          planType: true,
          installmentAmount: true,
          interval: true,
        },
      },
    },
  });

  if (!seller) notFound();

  const intervalLabel: Record<string, string> = {
    DAILY: 'day',
    WEEKLY: 'week',
    MONTHLY: 'month',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-brand-700">glotta</Link>
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-green-500" />
            Secure Installment Payments
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Store header */}
        <div className="flex items-center gap-4">
          {seller.storeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.storeLogo}
              alt={seller.storeName ?? seller.name}
              className="h-16 w-16 rounded-2xl object-cover border border-gray-100 shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-brand-700">
                {(seller.storeName ?? seller.name).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{seller.storeName ?? seller.name}</h1>
            {seller.storeDesc && (
              <p className="text-sm text-gray-500 mt-0.5">{seller.storeDesc}</p>
            )}
            <p className="text-xs text-brand-600 font-semibold mt-1 flex items-center gap-1">
              <Clock size={11} /> Pay in installments · Powered by Glotta
            </p>
          </div>
        </div>

        {/* Products grid */}
        {seller.products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <PackageOpen size={44} className="mx-auto text-gray-300 mb-4" />
            <p className="font-semibold text-gray-700">No active products yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seller.products.map((product) => (
              <Link
                key={product.id}
                href={`/pay/${slug}/${product.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-brand-50 to-purple-100 flex items-center justify-center">
                    <span className="text-4xl font-black text-brand-200">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 truncate">{product.name}</h2>
                  {product.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatNaira(product.price)}</p>
                      {product.planType === 'FIXED' && product.installmentAmount && (
                        <p className="text-xs text-gray-400">
                          {formatNaira(product.installmentAmount)}/{intervalLabel[product.interval ?? ''] ?? 'period'}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl ${
                        product.planType === 'FIXED'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {product.planType === 'FIXED' ? 'Fixed' : 'Flexible'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-brand-600 text-xs font-semibold">
                    Start installment plan <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Powered by{' '}
          <Link href="/" className="text-brand-600 font-semibold hover:underline">
            Glotta
          </Link>{' '}
          · Secure installment payments
        </p>
      </main>
    </div>
  );
}
