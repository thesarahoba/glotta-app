export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar skeleton */}
      <aside className="w-60 bg-white border-r border-gray-100 hidden md:flex flex-col px-4 py-6 gap-4">
        <div className="h-7 bg-brand-100 rounded-lg w-24 mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-6 space-y-6 animate-pulse">
        {/* Page header */}
        <div className="h-8 bg-gray-200 rounded-lg w-48" />

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-7 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="h-5 bg-gray-200 rounded w-32" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-50 flex items-center gap-4">
              <div className="h-4 bg-gray-100 rounded flex-1" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
