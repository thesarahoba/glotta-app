import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PaymentPlanType, PaymentInterval } from '@prisma/client';

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  quantity: z.number().int().positive().optional(),
  planType: z.nativeEnum(PaymentPlanType),
  lockFunds: z.boolean().default(true),
  allowOverpay: z.boolean().default(true),
  allowUnderpay: z.boolean().default(false),
  installmentAmount: z.number().positive().optional(),
  interval: z.nativeEnum(PaymentInterval).optional(),
  durationCount: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
}).refine((d) => {
  if (d.planType === 'FIXED') {
    return !!d.installmentAmount && !!d.interval && !!d.durationCount;
  }
  return true;
}, { message: 'Fixed plans require installmentAmount, interval, and durationCount' });

// GET /api/products — list seller's products
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { wallets: true } },
    },
  });

  return NextResponse.json(products);
}

// POST /api/products — create a product
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SELLER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        planType: data.planType,
        lockFunds: data.lockFunds,
        allowOverpay: data.allowOverpay,
        allowUnderpay: data.allowUnderpay,
        installmentAmount: data.installmentAmount,
        interval: data.interval,
        durationCount: data.durationCount,
        imageUrl: data.imageUrl,
        sellerId: session.user.id,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
