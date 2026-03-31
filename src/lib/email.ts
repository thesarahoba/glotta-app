import { Resend } from 'resend';

const FROM = 'Glotta <notifications@glotta.app>';

async function sendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(payload);
    if (error) {
      console.error('[resend] failed:', error);
    }
  } catch (err) {
    console.error('[resend] error:', err);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Glotta</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ede9fe;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px 32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">glotta</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#faf5ff;padding:20px 32px;border-top:1px solid #ede9fe;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            Glotta — Installment payments, the smart way.<br/>
            This is an automated message, please do not reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── email: payment confirmation → buyer ──────────────────────────────────────

export async function sendPaymentConfirmationEmail({
  buyerEmail,
  buyerName,
  productName,
  storeName,
  amount,
  balance,
  walletId,
}: {
  buyerEmail: string;
  buyerName: string;
  productName: string;
  storeName: string;
  amount: number;
  balance: number;
  walletId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const isComplete = balance <= 0;

  const body = baseLayout(`
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1f2937;">
      ${isComplete ? 'Payment Complete! 🎉' : 'Payment Confirmed ✅'}
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${buyerName},</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Product</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1f2937;">${productName}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">From</p>
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">${storeName}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Amount Paid</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#7c3aed;">${formatNaira(amount)}</p>
        ${!isComplete ? `
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Remaining Balance</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#374151;">${formatNaira(balance)}</p>` : `
        <p style="margin:0;font-size:14px;color:#16a34a;font-weight:600;">✅ Fully paid — the seller will process your order!</p>`}
      </td></tr>
    </table>

    <a href="${process.env.NEXTAUTH_URL}/buyer/${walletId}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
      View My Wallet
    </a>
  `);

  await sendEmail({
    from: FROM,
    to: buyerEmail,
    subject: isComplete
      ? `🎉 You've completed payment for ${productName}`
      : `✅ Payment of ${formatNaira(amount)} confirmed — ${productName}`,
    html: body,
  });
}

// ─── email: new payment alert → seller ────────────────────────────────────────

export async function sendNewPaymentAlertEmail({
  sellerEmail,
  sellerName,
  buyerName,
  productName,
  amount,
  isComplete,
}: {
  sellerEmail: string;
  sellerName: string;
  buyerName: string;
  productName: string;
  amount: number;
  isComplete: boolean;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const body = baseLayout(`
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1f2937;">
      ${isComplete ? 'Order Complete! 🎉' : 'New Payment Received 💰'}
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${sellerName},</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Buyer</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1f2937;">${buyerName}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Product</p>
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">${productName}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Amount</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#7c3aed;">${formatNaira(amount)}</p>
        ${isComplete ? `<p style="margin:8px 0 0;font-size:14px;color:#16a34a;font-weight:600;">✅ Buyer has paid in full — process their order!</p>` : ''}
      </td></tr>
    </table>

    <a href="${process.env.NEXTAUTH_URL}/dashboard/customers"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
      View Customers
    </a>
  `);

  await sendEmail({
    from: FROM,
    to: sellerEmail,
    subject: isComplete
      ? `🎉 ${buyerName} completed payment for ${productName}`
      : `💰 ${buyerName} paid ${formatNaira(amount)} for ${productName}`,
    html: body,
  });
}
