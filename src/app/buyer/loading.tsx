export default function BuyerLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <span className="text-lg font-bold text-brand-700">glotta</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-pulse">
        {/* Title */}
        <div>
          <div className="h-7 bg-gray-200 rounded-lg w-36 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-52" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3">
              <div className="h-3 bg-gray-100 rounded w-12 mx-auto mb-2" />
              <div className="h-5 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Wallet cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded w-44" />
              </div>
              <div className="h-5 w-5 bg-gray-100 rounded-full" />
            </div>
            <div className="h-2 bg-gray-100 rounded-full" />
            <div className="flex justify-between">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
