'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Bell, User } from 'lucide-react';

interface BuyerNavProps {
  unreadCount: number;
}

export function BuyerNav({ unreadCount }: BuyerNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/buyer' ? pathname === '/buyer' : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 z-20">
      <div className="max-w-lg mx-auto flex">
        <Link
          href="/buyer"
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
            isActive('/buyer') ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Wallet size={20} />
          Wallets
        </Link>

        <Link
          href="/buyer/notifications"
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
            isActive('/buyer/notifications') ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          Alerts
        </Link>

        <Link
          href="/buyer/profile"
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
            isActive('/buyer/profile') ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User size={20} />
          Profile
        </Link>
      </div>
    </nav>
  );
}
