import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processSuccessfulPayment } from '@/lib/payment-utils';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const verifySchema = z.object({
  reference: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid reference format'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 20 verifications per minute per user
    const rl = rateLimit(`verify:${session.user.id}`, 20, 60 * 1000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { reference } = parsed.data;

    // Verify with Paystack
    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    if (!psRes.ok) {
      return NextResponse.json({ error: 'Could not verify payment with Paystack' }, { status: 502 });
    }

    const psData = await psRes.json();

    if (psData.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful', status: psData.data?.status }, { status: 400 });
    }

    const result = await processSuccessfulPayment(reference);
    if (!result) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });

    return NextResponse.json({ ok: true, walletId: result.walletId });
  } catch (err) {
    console.error('[payments/verify]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
