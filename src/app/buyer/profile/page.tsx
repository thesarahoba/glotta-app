import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';
import BuyerProfileForm from '@/components/buyer/BuyerProfileForm';
import { User, Mail, ShieldCheck } from 'lucide-react';

export default async function BuyerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, shippingAddress: true },
  });

  const { name, email } = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <span className="text-lg font-bold text-brand-700">glotta</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* Avatar + name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-6 flex flex-col items-center text-center gap-2">
          <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-brand-700">
              {name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{name}</p>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-600 uppercase tracking-wide">
            Buyer
          </span>
        </div>

        {/* Info rows */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <div className="px-5 py-4 flex items-center gap-3">
            <User size={18} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{name}</p>
            </div>
          </div>
          <div className="px-5 py-4 flex items-center gap-3">
            <Mail size={18} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{email}</p>
            </div>
          </div>
          <div className="px-5 py-4 flex items-center gap-3">
            <ShieldCheck size={18} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Account Type</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">Buyer</p>
            </div>
          </div>
        </div>

        {/* Contact & address (editable) */}
        <BuyerProfileForm
          initialPhone={user?.phone ?? null}
          initialAddress={user?.shippingAddress ?? null}
        />

        {/* Sign out */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
