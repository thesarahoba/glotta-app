import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { MarkAllReadButton } from './MarkAllReadButton';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const typeIcons: Record<string, string> = {
    PAYMENT_RECEIVED: '💳',
    PAYMENT_CONFIRMED: '✅',
    WALLET_COMPLETED: '🎉',
    GENERAL: '📢',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-gray-700 text-lg">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">You'll be notified when buyers make payments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 px-5 py-4 ${!notif.isRead ? 'bg-brand-50/40' : ''}`}
            >
              <span className="text-2xl leading-none mt-0.5 shrink-0">
                {typeIcons[notif.type] ?? '📢'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
