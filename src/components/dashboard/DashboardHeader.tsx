import Link from 'next/link';
import { Bell } from 'lucide-react';

interface Props {
  userName: string;
  unreadCount?: number;
  storeName?: string;
}

export default function DashboardHeader({ userName, unreadCount = 0, storeName }: Props) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Brand shown only on mobile (sidebar is hidden on mobile) */}
      <div className="lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-brand-600">Glotta</span>
          {storeName && <span className="text-xs text-gray-400 truncate max-w-[130px]">{storeName}</span>}
        </Link>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2">
        <Link href="/dashboard/notifications" className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
