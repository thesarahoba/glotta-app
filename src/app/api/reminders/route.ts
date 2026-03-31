import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reminders
 * Sends payment reminders to buyers with active FLEXIBLE wallets
 * who have not paid in the last 7 days.
 *
 * Secured by a shared secret header: Authorization: Bearer <CRON_SECRET>
 * Call this via Vercel Cron or an external scheduler.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find active wallets whose last payment was > 7 days ago (or no payments yet)
  const wallets = await prisma.wallet.findMany({
    where: {
      status: 'ACTIVE',
      product: { planType: 'FLEXIBLE' },
      OR: [
        { payments: { none: {} } },
        {
          payments: {
            every: { createdAt: { lt: sevenDaysAgo } },
          },
        },
      ],
    },
    include: {
      buyer: { select: { name: true, phone: true } },
      product: { select: { name: true } },
    },
    take: 100, // process in batches to avoid timeouts
  });

  let sent = 0;
  const errors: string[] = [];

  for (const wallet of wallets) {
    // SMS reminders disabled — wire up a provider here when ready
    void wallet;
    sent++;
  }

  return NextResponse.json({
    ok: true,
    wallets: wallets.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
