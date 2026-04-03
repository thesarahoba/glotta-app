import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const schema = z
  .object({
    productId: z.string().min(1),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().max(20).default(''),
    address: z.string().max(200).default(''),
    quantity: z.number().int().min(1).max(100).default(1),
    isExisting: z.boolean().default(false),
  })
  .refine((d) => d.isExisting || d.phone.length >= 7, {
    message: 'Phone must be at least 7 characters',
    path: ['phone'],
  })
  .refine((d) => d.isExisting || d.address.length >= 3, {
    message: 'Address is required',
    path: ['address'],
  });

export async function POST(req: NextRequest) {
  // 5 join attempts per 15 minutes per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`join:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { productId, name, email: rawEmail, password, phone, address, quantity, isExisting } = parsed.data;
    const email = rawEmail.toLowerCase();

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { storeName: true, storeSlug: true } } },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Product not found or no longer available.' }, { status: 404 });
    }

    let buyer = await prisma.user.findUnique({ where: { email } });

    if (buyer) {
      // Existing user — verify password
      if (buyer.role !== 'BUYER') {
        return NextResponse.json({ error: 'This email is registered as a seller account.' }, { status: 400 });
      }
      const valid = await bcrypt.compare(password, buyer.password);
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
      }
    } else {
      if (isExisting) {
        return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 });
      }
      // Create new buyer
      const hashed = await bcrypt.hash(password, 12);
      buyer = await prisma.user.create({
        data: {
          email,
          password: hashed,
          name,
          phone,
          role: 'BUYER',
          ...(address && { shippingAddress: address }),
        },
      });
    } else if (address && !buyer.shippingAddress) {
      // Save address to profile if they haven't set one yet
      await prisma.user.update({ where: { id: buyer.id }, data: { shippingAddress: address } });
    }

    // Check for existing wallet (already joined)
    const existing = await prisma.wallet.findUnique({
      where: { buyerId_productId: { buyerId: buyer.id, productId } },
    });

    if (existing) {
      return NextResponse.json({ walletId: existing.id, alreadyJoined: true });
    }

    // Create wallet
    const totalPrice = product.price * quantity;
    // For existing users, use their stored name/phone — the form sends email as name placeholder
    const walletBuyerName = isExisting ? buyer.name : name;
    const walletBuyerPhone = isExisting ? (buyer.phone ?? phone) : phone;
    const wallet = await prisma.wallet.create({
      data: {
        buyerId: buyer.id,
        productId,
        totalPrice,
        balance: totalPrice,
        amountPaid: 0,
        progressPercent: 0,
        buyerName: walletBuyerName,
        buyerPhone: walletBuyerPhone,
        buyerAddress: address,
        quantity,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ walletId: wallet.id, alreadyJoined: false }, { status: 201 });
  } catch (err) {
    console.error('[wallets/join]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
