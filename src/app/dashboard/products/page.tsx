import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, ExternalLink } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { CopyLinkButton } from '@/components/products/CopyLinkButton';

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const products = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    include: { _count: { select: { wallets: true } } },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  const baseUrl = process.env.NEXTAUTH_URL ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-all">
          <Plus size={16} /><span className="hidden sm:inline">New Product</span>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-700 font-semibold text-lg">No products yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Create a product and share its payment link with your customers.</p>
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
            <Plus size={16} /> Create First Product
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => {
            const payLink = `${baseUrl}/pay/${session.user.storeSlug}/${product.id}`;
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/products/${product.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                        {product.name}
                      </Link>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.planType === 'FIXED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {product.planType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">{formatNaira(product.price)}</span>
                      {product.planType === 'FIXED' && product.installmentAmount && (
                        <span>{formatNaira(product.installmentAmount)} / {product.interval?.toLowerCase()}</span>
                      )}
                      <span>{product._count.wallets} buyer{product._count.wallets !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CopyLinkButton payLink={payLink} />
                    <Link href={payLink} target="_blank" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all" title="Open payment page">
                      <ExternalLink size={16} />
                    </Link>
                    <Link href={`/dashboard/products/${product.id}`} className="text-sm font-medium text-brand-600 hover:underline px-3 py-1.5 bg-brand-50 rounded-lg">
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

