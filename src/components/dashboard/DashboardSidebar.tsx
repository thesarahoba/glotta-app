'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Bell,
  Wallet,
  LogOut,
  Store,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Withdraw', href: '/dashboard/withdraw', icon: Wallet },
];

interface Props {
  storeName?: string;
  storeSlug?: string;
}

export default function DashboardSidebar({ storeName, storeSlug }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-60 bg-white border-r border-gray-100 flex-col min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-brand-600">Glotta</span>
        </Link>
        {storeName && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{storeName}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 flex flex-col gap-1">
        {storeSlug && (
          <Link
            href={`/store/${storeSlug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
          >
            <Store size={18} />
            View Storefront
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
