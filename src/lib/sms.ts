function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/**
 * Send an SMS via Africa's Talking.
 * Silently no-ops if AT_API_KEY is not set.
 *
 * Sandbox (free): set AT_USERNAME="sandbox" and get a free API key at
 *   https://account.africastalking.com/auth/register
 * Production: set AT_USERNAME to your real username.
 *
 * Phone number should be in Nigerian format e.g. "08012345678" or "+2348012345678".
 */
async function sendSMS(to: string, message: string): Promise<void> {
  const apiKey = process.env.AT_API_KEY;
  if (!apiKey) return;

  const username = process.env.AT_USERNAME ?? 'sandbox';
  const isSandbox = username === 'sandbox';
  const endpoint = isSandbox
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging';

  // Normalize to international format (+234...)
  let phone = to.replace(/\s+/g, '');
  if (phone.startsWith('0')) phone = '+234' + phone.slice(1);
  if (!phone.startsWith('+')) phone = '+234' + phone;

  const params = new URLSearchParams({ username, to: phone, message });
  const senderId = process.env.AT_SENDER_ID;
  if (senderId) params.set('from', senderId);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[africastalking] SMS failed:', text);
    }
  } catch (err) {
    console.error('[africastalking] SMS error:', err);
  }
}

// ─── payment receipt SMS → buyer ──────────────────────────────────────────────

export async function sendPaymentReceiptSMS({
  phone,
  buyerName,
  amount,
  productName,
  balance,
}: {
  phone: string;
  buyerName: string;
  amount: number;
  productName: string;
  balance: number;
}) {
  const isComplete = balance <= 0;

  const message = isComplete
    ? `Hi ${buyerName}, you've completed payment for ${productName}! The seller will process your order. - Glotta`
    : `Hi ${buyerName}, your payment of ${formatNaira(amount)} for ${productName} has been confirmed. Remaining balance: ${formatNaira(balance)}. - Glotta`;

  await sendSMS(phone, message);
}

// ─── payment reminder SMS → buyer ─────────────────────────────────────────────

export async function sendPaymentReminderSMS({
  phone,
  buyerName,
  productName,
  balance,
}: {
  phone: string;
  buyerName: string;
  productName: string;
  balance: number;
}) {
  const message = `Hi ${buyerName}, just a reminder — you still have ${formatNaira(balance)} remaining for ${productName} on Glotta. Tap your wallet link to pay. - Glotta`;
  await sendSMS(phone, message);
}
