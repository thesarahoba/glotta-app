import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRef } from '@/lib/utils';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const schema = z.object({
  walletId: z.string().min(1),
  amount: z.number().min(100), // minimum ₦100
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 20 payment initiations per minute per user
    const rl = rateLimit(`initiate:${session.user.id}`, 20, 60 * 1000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { walletId, amount } = parsed.data;

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: { buyer: { select: { email: true } } },
    });

    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    if (wallet.buyerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (wallet.status === 'COMPLETED') return NextResponse.json({ error: 'Wallet already completed' }, { status: 400 });

    // Cap amount at remaining balance
    const cappedAmount = Math.min(amount, wallet.balance);

    const reference = generateRef();

    // Create a pending Payment record
    await prisma.payment.create({
      data: {
        walletId,
        amount: cappedAmount,
        reference,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      reference,
      email: wallet.buyer.email,
      amount: Math.round(cappedAmount * 100), // kobo for Paystack
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    });
  } catch (err) {
    console.error('[payments/initiate]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
