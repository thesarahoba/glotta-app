import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/notifications/read — mark all as read
// PATCH /api/notifications/read?id=xxx — mark one as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Mark single notification read — verify ownership
      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif || notif.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
    } else {
      // Mark all read for this user
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notifications/read]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
