export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-2xl font-extrabold text-brand-600">Glotta</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
