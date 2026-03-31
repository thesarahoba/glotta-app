'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
    >
      <LogOut size={18} />
      Sign out
    </button>
  );
}
