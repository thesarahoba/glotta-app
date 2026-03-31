import Link from 'next/link';
import { ShieldCheck, TrendingUp, Bell, Smartphone, ArrowRight, CheckCircle2, Users, Repeat } from 'lucide-react';

const features = [
  {
    icon: <TrendingUp size={22} className="text-brand-600" />,
    title: 'Real-time progress tracking',
    desc: 'Both seller and buyer see a live progress bar. No more manually calculating balances in WhatsApp threads.',
  },
  {
    icon: <Bell size={22} className="text-brand-600" />,
    title: 'Automatic notifications',
    desc: 'Buyers get SMS + email receipts every payment. Sellers get instant alerts. Zero manual follow-up.',
  },
  {
    icon: <ShieldCheck size={22} className="text-brand-600" />,
    title: 'Paystack-secured payments',
    desc: 'Every kobo flows through Paystack. Card, bank transfer, USSD — all handled for you.',
  },
  {
    icon: <Smartphone size={22} className="text-brand-600" />,
    title: 'Mobile-first wallet system',
    desc: 'Buyers get a personal wallet per product. They can pay any amount, any time, on any device.',
  },
  {
    icon: <Repeat size={22} className="text-brand-600" />,
    title: 'Fixed or flexible plans',
    desc: 'Set a fixed installment schedule or let buyers pay what they can. You choose the structure.',
  },
  {
    icon: <Users size={22} className="text-brand-600" />,
    title: 'Customer dashboard',
    desc: 'See all your buyers in one place — who\'s paid, who\'s behind, who\'s completed.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create your product',
    desc: 'Set a price, choose fixed or flexible payment plan, and your shareable link is ready instantly.',
  },
  {
    step: '02',
    title: 'Share the link',
    desc: 'Send your payment link on WhatsApp, Instagram, or anywhere. No app download required for buyers.',
  },
  {
    step: '03',
    title: 'Collect automatically',
    desc: 'Buyers pay in installments via Paystack. Your dashboard updates in real time. You get paid.',
  },
];

const testimonials = [
  {
    quote: 'I used to track 40 customers in a notebook. Now I just check Glotta. It\'s saved me hours every week.',
    name: 'Adaeze O.',
    role: 'Fabric & Fashion Seller, Lagos',
  },
  {
    quote: 'My buyers trust me more now because they can see their own progress. I\'ve had fewer disputes since I started.',
    name: 'Chukwuemeka N.',
    role: 'Electronics Reseller, Abuja',
  },
  {
    quote: 'The SMS receipt on every payment is a game changer. My customers feel like they\'re using a bank.',
    name: 'Fatima M.',
    role: 'Beauty & Skincare Seller, Kano',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-extrabold text-brand-700 tracking-tight">glotta</span>
          <nav className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register?role=seller"
              className="text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition"
            >
              Start for free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-50 via-white to-purple-50 px-4 pt-20 pb-24 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Built for Nigerian informal commerce
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Installment payments,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-500">
                finally structured.
              </span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
              Replace notebooks &amp; WhatsApp threads with a clean, trackable system.
              Sellers share a link. Buyers pay in parts. Everyone sees progress.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/auth/register?role=seller"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3.5 rounded-xl transition text-base shadow-lg shadow-brand-200"
              >
                Create your store <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition text-base"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-5 text-sm text-gray-400">Free to start · No monthly fees · Paystack-powered</p>
          </div>
        </section>

        {/* Social proof strip */}
        <section className="bg-brand-700 text-white py-5 px-4 text-center">
          <p className="text-sm font-medium">
            Trusted by sellers tracking &mdash; &nbsp;
            <span className="font-bold">₦10M+</span> in installment payments across Nigeria
          </p>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">How it works</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Set up in under 5 minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-black text-brand-50 leading-none mb-3 select-none">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Features</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Everything you need, nothing you don&apos;t</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Testimonials</p>
            <h2 className="text-3xl font-extrabold text-gray-900">What sellers are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-gray-700 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-brand-600 to-purple-600 px-4 py-20 text-center text-white">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold mb-4">Ready to stop chasing payments?</h2>
            <p className="text-brand-100 mb-8">
              Create your store, list your first product, and start collecting structured installments today.
            </p>
            <Link
              href="/auth/register?role=seller"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition shadow-lg text-base"
            >
              Create your free store <ArrowRight size={16} />
            </Link>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-brand-100">
              {['No setup fee', 'Paystack-secured', 'SMS &amp; email receipts', 'Works on any phone'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-green-300" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 px-4 py-8 text-center text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} Glotta &nbsp;·&nbsp; Powered by Paystack &nbsp;·&nbsp; Built for Nigeria
          </p>
        </footer>
      </main>
    </div>
  );
}

