import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-12 max-w-md w-full text-center">
        <div className="h-14 w-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <SearchX size={28} className="text-brand-500" />
        </div>
        <p className="text-5xl font-black text-brand-200 mb-2">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-2.5 rounded-xl transition text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
