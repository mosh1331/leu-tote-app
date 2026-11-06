// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { hashString } from '@/lib/otpService';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { phone, otp, fullName } = await req.json();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const incomingHash = hashString(otp.trim());

    const result = await withTransaction(async (client) => {
      // 1. Verify OTP record
      const otpRecord = await client.query(
        `SELECT id, attempts FROM phone_otps 
         WHERE phone = $1 AND verified = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [cleanPhone]
      );

      if (otpRecord.rowCount === 0) {
        throw new Error('OTP expired or not found. Please request a new one.');
      }

      const { id: otpId, attempts } = otpRecord.rows[0];

      if (attempts >= 5) {
        throw new Error('Too many invalid attempts. Please request a fresh OTP.');
      }

      const matchRes = await client.query(
        'SELECT id FROM phone_otps WHERE id = $1 AND otp_hash = $2',
        [otpId, incomingHash]
      );

      if (matchRes.rowCount === 0) {
        await client.query('UPDATE phone_otps SET attempts = attempts + 1 WHERE id = $1', [otpId]);
        throw new Error('Incorrect verification code. Please try again.');
      }

      // Mark OTP as verified
      await client.query('UPDATE phone_otps SET verified = TRUE WHERE id = $1', [otpId]);

      // 2. Upsert user as registered
      const userRes = await client.query(
        `INSERT INTO users (phone, full_name, is_registered, referral_code)
         VALUES ($1, $2, TRUE, 'LEU-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4)))
         ON CONFLICT (phone) DO UPDATE 
         SET is_registered = TRUE,
             full_name = COALESCE(users.full_name, EXCLUDED.full_name, $2),
             referral_code = COALESCE(users.referral_code, 'LEU-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4))),
             updated_at = NOW()
         RETURNING id, phone, full_name, referral_code`,
        [cleanPhone, fullName || null]
      );
      const user = userRes.rows[0];

      // 3. Unlock PENDING_CLAIM points to AVAILABLE
      await client.query(
        `UPDATE reward_points 
         SET status = 'AVAILABLE' 
         WHERE user_id = $1 AND status = 'PENDING_CLAIM'`,
        [user.id]
      );

      // 4. Create 45-day persistent session
      const rawRefreshToken = crypto.randomBytes(40).toString('hex');
      const refreshTokenHash = hashString(rawRefreshToken);
      const sessionExpiry = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // 45 Days

      await client.query(
        `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, refreshTokenHash, sessionExpiry]
      );

      return { user, rawRefreshToken };
    });

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Logged in successfully. Guest points unlocked!',
    });

    // Set secure long-lived cookie
    response.cookies.set('leu_session_token', result.rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 45 * 24 * 60 * 60, // 45 days in seconds
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}