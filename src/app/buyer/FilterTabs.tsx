'use client';

import { useRouter, usePathname } from 'next/navigation';

interface FilterTabsProps {
  current: string;
  counts: { all: number; active: number; completed: number };
}

export function FilterTabs({ current, counts }: FilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() =>
            router.push(tab.key === 'all' ? pathname : `${pathname}?tab=${tab.key}`)
          }
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            current === tab.key
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-200 hover:text-brand-600'
          }`}
        >
          {tab.label}
          <span
            className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
              current === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
