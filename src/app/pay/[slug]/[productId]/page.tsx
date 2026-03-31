import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatNaira } from '@/lib/utils';
import { ShieldCheck, Clock, Repeat } from 'lucide-react';
import { JoinForm } from './JoinForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      seller: { select: { storeName: true, storeSlug: true } },
    },
  });

  if (!product || product.seller.storeSlug !== slug) {
    return { title: 'Product not found' };
  }

  const title = `${product.name} — ${product.seller.storeName} on Glotta`;
  const description =
    product.description ??
    `Pay for ${product.name} in installments. Total: ₦${product.price.toLocaleString('en-NG')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function PayPage({ params }: PageProps) {
  const { slug, productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { select: { name: true, storeName: true, storeSlug: true, storeLogo: true } } },
  });

  if (!product || !product.isActive || product.seller.storeSlug !== slug) notFound();

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
          <span className="text-xs text-gray-400 font-medium">Secure Installment Payments</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Product card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
          )}
          <div className="p-5">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
              {product.seller.storeName}
            </p>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            {product.description && (
              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNaira(product.price)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total price</p>
              </div>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${product.planType === 'FIXED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {product.planType === 'FIXED' ? '📅 Fixed Plan' : '🔄 Flexible'}
              </span>
            </div>

            {product.planType === 'FIXED' && product.installmentAmount && (
              <div className="mt-3 bg-brand-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <Repeat size={16} className="text-brand-600 shrink-0" />
                <p className="text-sm text-brand-800">
                  Pay <strong>{formatNaira(product.installmentAmount)}</strong> per {intervalLabel[product.interval ?? 'WEEK'] ?? 'period'}
                  {product.durationCount ? ` for ${product.durationCount} payments` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500" /> Secured by Glotta</span>
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-500" /> Pay at your pace</span>
        </div>

        {/* Join form */}
        <JoinForm productId={product.id} productName={product.name} price={product.price} />
      </main>
    </div>
  );
}
