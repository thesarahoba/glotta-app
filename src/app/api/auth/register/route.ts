import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { slugify } from '@/lib/utils';
import { Role } from '@prisma/client';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const sellerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.literal('SELLER'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  phone: z.string().optional(),
});

const buyerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.literal('BUYER'),
  phone: z.string().optional(),
});

const registerSchema = z.discriminatedUnion('role', [sellerSchema, buyerSchema]);

export async function POST(request: Request) {
  // 5 registrations per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    if (data.role === 'SELLER') {
      // Generate unique store slug
      const baseSlug = slugify(data.storeName);
      let storeSlug = baseSlug;
      let suffix = 1;

      while (await prisma.user.findUnique({ where: { storeSlug } })) {
        storeSlug = `${baseSlug}${suffix}`;
        suffix++;
      }

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          role: Role.SELLER,
          phone: data.phone,
          storeName: data.storeName,
          storeSlug,
        },
        select: { id: true, email: true, name: true, role: true, storeSlug: true },
      });

      return NextResponse.json(
        { message: 'Account created successfully', user },
        { status: 201 }
      );
    } else {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          role: Role.BUYER,
          phone: data.phone,
        },
        select: { id: true, email: true, name: true, role: true },
      });

      return NextResponse.json(
        { message: 'Account created successfully', user },
        { status: 201 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
