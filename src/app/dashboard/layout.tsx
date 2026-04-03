import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardMobileNav from '@/components/dashboard/DashboardMobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SELLER') redirect('/auth/login');

  let unreadCount = 0;
  try {
    unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
  } catch {
    // DB temporarily unreachable — render layout without count
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar storeName={session.user.storeName} storeSlug={session.user.storeSlug} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader userName={session.user.name ?? ''} unreadCount={unreadCount} storeName={session.user.storeName} />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
