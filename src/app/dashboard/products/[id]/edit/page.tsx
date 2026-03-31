import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductForm } from '@/components/products/ProductForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.sellerId !== session.user.id) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/products/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> {product.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <ProductForm
        mode="edit"
        productId={id}
        defaultValues={{
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          planType: product.planType as 'FIXED' | 'FLEXIBLE',
          installmentAmount: product.installmentAmount,
          interval: product.interval as 'DAILY' | 'WEEKLY' | 'MONTHLY' | null,
          durationCount: product.durationCount,
          lockFunds: product.lockFunds,
          isActive: product.isActive,
          imageUrl: product.imageUrl,
        }}
      />
    </div>
  );
}
