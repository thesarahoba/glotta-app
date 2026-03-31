import { prisma } from '@/lib/prisma';
import { sendPaymentConfirmationEmail, sendNewPaymentAlertEmail } from '@/lib/email';

/**
 * Shared logic: mark a payment SUCCESS and update the wallet.
 * Used by both /api/payments/verify and /api/webhooks/paystack.
 * Returns null if the payment doesn't exist or was already processed.
 */
export async function processSuccessfulPayment(reference: string): Promise<{ walletId: string } | null> {
  // Find payment — must be PENDING to avoid double-processing
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: {
      wallet: {
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!payment) return null;
  if (payment.status === 'SUCCESS') return { walletId: payment.walletId }; // idempotent

  const wallet = payment.wallet;
  const buyer = wallet.buyer;

  const newAmountPaid = wallet.amountPaid + payment.amount;
  const newBalance = Math.max(0, wallet.totalPrice - newAmountPaid);
  const newProgress = Math.min(100, Math.round((newAmountPaid / wallet.totalPrice) * 100));
  const isComplete = newAmountPaid >= wallet.totalPrice;

  // Points: 1 point per ₦100 paid, bonus 50 on completion
  const pointsEarned = Math.floor(payment.amount / 100) + (isComplete ? 50 : 0);

  // Milestone notifications (fire if this payment crosses a threshold)
  const prevProgress = Math.min(100, Math.round((wallet.amountPaid / wallet.totalPrice) * 100));
  const milestones = [50, 75, 90] as const;
  const crossedMilestones = milestones.filter(
    (m) => prevProgress < m && newProgress >= m && !isComplete,
  );
  const milestoneMessages: Record<number, { title: string; message: string }> = {
    50: { title: 'Halfway there! 🎯', message: `You're 50% done paying for ${'' /* filled below */}. Keep it up!` },
    75: { title: '75% done! 🔥', message: `You're 75% of the way to completing your payment for ${''}.` },
    90: { title: 'Almost there! 💪', message: `Just 10% left to complete your payment for ${''}.` },
  };

  // Fetch sellerId + seller user before entering transaction
  const product = await prisma.product.findUnique({
    where: { id: wallet.productId },
    select: {
      sellerId: true,
      name: true,
      seller: { select: { name: true, email: true, storeName: true } },
    },
  });
  const sellerId = product!.sellerId;
  const seller = product!.seller;
  const productName = product!.name;

  // Fill milestone messages with product name now that we have it
  milestoneMessages[50].message = `You're 50% done paying for ${productName}. Keep it up!`;
  milestoneMessages[75].message = `You're 75% of the way to completing your payment for ${productName}.`;
  milestoneMessages[90].message = `Just 10% left to complete your payment for ${productName}.`;

  await prisma.$transaction([
    // Mark payment succeeded
    prisma.payment.update({
      where: { reference },
      data: { status: 'SUCCESS' },
    }),
    // Update wallet (progress + points)
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        progressPercent: newProgress,
        status: isComplete ? 'COMPLETED' : 'ACTIVE',
        points: { increment: pointsEarned },
      },
    }),
    // Notify seller
    prisma.notification.create({
      data: {
        userId: sellerId,
        type: isComplete ? 'WALLET_COMPLETED' : 'PAYMENT_RECEIVED',
        title: isComplete ? 'Order Complete 🎉' : 'Payment Received',
        message: isComplete
          ? `${buyer.name} has completed payment for ${productName}.`
          : `Payment of ₦${payment.amount.toLocaleString()} received from ${buyer.name}.`,
      },
    }),
    // Notify buyer
    prisma.notification.create({
      data: {
        userId: buyer.id,
        type: isComplete ? 'WALLET_COMPLETED' : 'PAYMENT_CONFIRMED',
        title: isComplete ? 'Payment Complete! 🎉' : 'Payment Confirmed',
        message: isComplete
          ? `You've completed payment for ${productName}. The seller will process your order. You earned ${pointsEarned} points!`
          : `Your payment of ₦${payment.amount.toLocaleString()} for ${productName} was confirmed. +${pointsEarned} points!`,
      },
    }),
    // Milestone notifications
    ...crossedMilestones.map((m) =>
      prisma.notification.create({
        data: {
          userId: buyer.id,
          type: 'GENERAL',
          title: milestoneMessages[m].title,
          message: milestoneMessages[m].message,
        },
      }),
    ),
  ]);

  // Fire email + SMS non-blocking (failures must not affect payment record)
  void sendPaymentConfirmationEmail({
    buyerEmail: buyer.email,
    buyerName: buyer.name,
    productName,
    storeName: seller.storeName ?? seller.name,
    amount: payment.amount,
    balance: newBalance,
    walletId: wallet.id,
  }).catch((err) => console.error('[email] buyer confirmation failed:', err));

  void sendNewPaymentAlertEmail({
    sellerEmail: seller.email,
    sellerName: seller.name,
    buyerName: buyer.name,
    productName,
    amount: payment.amount,
    isComplete,
  }).catch((err) => console.error('[email] seller alert failed:', err));

  return { walletId: wallet.id };
}
