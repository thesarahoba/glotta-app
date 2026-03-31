import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processSuccessfulPayment } from '@/lib/payment-utils';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Verify HMAC-SHA512 signature
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const reference = event.data?.reference as string | undefined;
      if (reference) {
        await processSuccessfulPayment(reference);
      }
    }

    // Always return 200 to Paystack so it stops retrying
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhooks/paystack]', err);
    // Still return 200 — we don't want Paystack to retry on our processing errors
    return NextResponse.json({ received: true });
  }
}
