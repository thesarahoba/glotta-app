import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, Users, TrendingUp, Plus } from 'lucide-react';
import { formatNaira } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const [products, wallets] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: session.user.id },
      include: { _count: { select: { wallets: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.wallet.findMany({
      where: { product: { sellerId: session.user.id } },
      select: { amountPaid: true, status: true },
    }),
  ]);

  const totalCollected = wallets.reduce((sum, w) => sum + w.amountPaid, 0);
  const activeInstallments = wallets.filter((w) => w.status === 'ACTIVE').length;
  const completedOrders = wallets.filter((w) => w.status === 'COMPLETED').length;

  const stats = [
    { label: 'Total Collected', value: formatNaira(totalCollected), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Installments', value: activeInstallments, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Completed Orders', value: completedOrders, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Products', value: products.length, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {session.user.name?.split(' ')[0]} 👋</p>
        </div>
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-all">
          <Plus size={16} /><span className="hidden sm:inline">New Product</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Products</h2>
          <Link href="/dashboard/products" className="text-sm text-brand-600 hover:underline font-medium">View all</Link>
        </div>
        {products.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No products yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first product to get started</p>
            <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-brand-600 hover:underline">
              <Plus size={15} /> Create a product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {products.map((product) => (
              <Link key={product.id} href={`/dashboard/products/${product.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {formatNaira(product.price)} ·{' '}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.planType === 'FIXED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {product.planType}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{product._count.wallets} buyer{product._count.wallets !== 1 ? 's' : ''}</p>
                  <p className={`text-xs font-medium mt-0.5 ${product.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
