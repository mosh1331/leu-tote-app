// middleware.js
import { NextResponse } from 'next/server';
import { verifyAdminToken } from './lib/adminAuth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Allow login API and login page without authentication
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next();
  }

  // 2. Intercept admin web routes & admin API endpoints
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const cookie = req.cookies.get('admin_session')?.value;
    const adminPin = process.env.ADMIN_PIN;
    const authSecret = process.env.ADMIN_AUTH_SECRET || 'fallback-secret-leu-tote';

    const isValid = await verifyAdminToken(cookie, adminPin, authSecret);

    if (!isValid) {
      // Return 401 JSON for API calls
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized backoffice access' }, { status: 401 });
      }

      // Redirect browser visits to the Admin PIN entry page
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};