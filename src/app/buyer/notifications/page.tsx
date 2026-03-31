import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Bell, CheckCircle2, CreditCard, Star } from 'lucide-react';
import { MarkAllReadButton } from '@/app/dashboard/notifications/MarkAllReadButton';

function notifIcon(type: string) {
  if (type === 'PAYMENT_CONFIRMED' || type === 'PAYMENT_RECEIVED') {
    return <CreditCard size={18} className="text-brand-500" />;
  }
  if (type === 'WALLET_COMPLETED') {
    return <CheckCircle2 size={18} className="text-green-500" />;
  }
  return <Star size={18} className="text-amber-500" />;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function BuyerNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-700">glotta</span>
          {hasUnread && <MarkAllReadButton />}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-14 text-center">
            <Bell size={44} className="mx-auto text-gray-300 mb-4" />
            <p className="font-semibold text-gray-700">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">We'll let you know when something happens.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-5 py-4 flex items-start gap-3 ${!notif.isRead ? 'bg-brand-50/50' : ''}`}
              >
                <div className="mt-0.5 shrink-0">{notifIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold text-gray-900 ${!notif.isRead ? 'font-bold' : ''}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
