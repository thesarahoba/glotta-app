'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/read', { method: 'PATCH' });
      toast.success('All notifications marked as read');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'Marking…' : 'Mark all read'}
    </button>
  );
}
