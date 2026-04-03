import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  shippingAddress: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.shippingAddress !== undefined && { shippingAddress: parsed.data.shippingAddress }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
    },
    select: { shippingAddress: true, phone: true },
  });

  return NextResponse.json(updated);
}
