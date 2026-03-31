import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Seller tries to access buyer routes
    if (pathname.startsWith('/buyer') && token?.role !== 'BUYER') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Buyer tries to access seller dashboard
    if (pathname.startsWith('/dashboard') && token?.role !== 'SELLER') {
      return NextResponse.redirect(new URL('/buyer', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/buyer/:path*'],
};
