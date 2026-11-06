// app/api/admin/auth/route.js
import { NextResponse } from 'next/server';
import { generateAdminToken } from '@/lib/adminAuth';

export async function POST(req) {
  try {
    const { pin } = await req.json();

    const expectedPin = process.env.ADMIN_PIN;
    const authSecret = process.env.ADMIN_AUTH_SECRET || 'fallback-secret-leu-tote';

    if (!pin || pin.toString().trim() !== expectedPin) {
      return NextResponse.json({ error: 'Invalid 4-digit PIN' }, { status: 401 });
    }

    const token = await generateAdminToken(expectedPin, authSecret);

    const res = NextResponse.json({ success: true, message: 'Authenticated' });
    
    // Set secure, httpOnly cookie valid for 7 days
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}