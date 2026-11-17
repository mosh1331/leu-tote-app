// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

const DUMMY_OTP = '123456';

export async function POST(req) {
  try {
    const { phone, otp, fullName } = await req.json();
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    if ((otp || '').trim() !== DUMMY_OTP) {
      return NextResponse.json(
        { error: 'Invalid 6-digit OTP. Use 123456 for testing.' },
        { status: 400 }
      );
    }

    const userData = await withTransaction(async (client) => {
      const generatedRefCode =
        'LEU-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      // 1. Upsert user: preserve existing name/referral_code if returning guest
      const userRes = await client.query(
        `INSERT INTO users (phone, full_name, is_registered, referral_code)
         VALUES ($1, $2, TRUE, $3)
         ON CONFLICT (phone) DO UPDATE SET
           full_name = COALESCE(NULLIF($2, ''), users.full_name, 'Leu Tote Member'),
           is_registered = TRUE,
           referral_code = COALESCE(users.referral_code, $3),
           updated_at = NOW()
         RETURNING id, phone, full_name, email, referral_code, is_registered`,
        [cleanPhone, (fullName || '').trim() || null, generatedRefCode]
      );
      const user = userRes.rows[0];

      // 2. Unlock any PENDING_CLAIM points earned during past guest orders
      const unlockRes = await client.query(
        `UPDATE reward_points
         SET status = 'AVAILABLE'
         WHERE user_id = $1 AND status = 'PENDING_CLAIM'
         RETURNING points`,
        [user.id]
      );
      const newlyUnlocked = unlockRes.rows.reduce((sum, r) => sum + Number(r.points || 0), 0);

      return { user, newlyUnlocked };
    });

    const response = NextResponse.json({
      success: true,
      user: userData.user,
      newlyUnlockedPoints: userData.newlyUnlocked,
    });

    // 3. Set 45-day session cookie
    response.cookies.set('leu_user_session', userData.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 45,
    });

    return response;
  } catch (error) {
    console.error('[VERIFY OTP ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}