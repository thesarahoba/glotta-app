import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Glotta — Structured Installment Payments',
  description:
    'Turn messy informal installment payments into a structured, trackable system. Built for Nigerian informal commerce.',
  keywords: ['installment payments', 'Nigeria', 'buy now pay later', 'informal commerce'],
  openGraph: {
    title: 'Glotta',
    description: 'Structured installment payments for informal commerce.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                fontSize: '14px',
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
