// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import crypto from 'crypto';

function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function POST(req) {
  try {
    const { phone, otp, fullName } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const incomingHash = hashString(otp.trim());

    const result = await withTransaction(async (client) => {
      // 1. Verify OTP record
      const otpRes = await client.query(
        `SELECT id, attempts FROM phone_otps 
         WHERE phone = $1 AND verified = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [cleanPhone]
      );

      if (otpRes.rowCount === 0) {
        throw new Error('OTP expired or not found. Please request a new one.');
      }

      const { id: otpId, attempts } = otpRes.rows[0];
      if (attempts >= 5) {
        throw new Error('Too many incorrect attempts. Please request a new OTP.');
      }

      const matchRes = await client.query(
        'SELECT id FROM phone_otps WHERE id = $1 AND otp_hash = $2',
        [otpId, incomingHash]
      );

      if (matchRes.rowCount === 0) {
        await client.query('UPDATE phone_otps SET attempts = attempts + 1 WHERE id = $1', [otpId]);
        throw new Error('Invalid verification code.');
      }

      // Mark OTP as used
      await client.query('UPDATE phone_otps SET verified = TRUE WHERE id = $1', [otpId]);

      // 2. Upgrade user profile to registered & assign unique referral code
      const referralCode = 'LEU-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const userRes = await client.query(
        `INSERT INTO users (phone, full_name, is_registered, referral_code)
         VALUES ($1, $2, TRUE, $3)
         ON CONFLICT (phone) DO UPDATE 
         SET is_registered = TRUE,
             full_name = COALESCE(users.full_name, EXCLUDED.full_name, $2),
             referral_code = COALESCE(users.referral_code, $3),
             updated_at = NOW()
         RETURNING id, phone, full_name, referral_code`,
        [cleanPhone, fullName?.trim() || null, referralCode]
      );
      const user = userRes.rows[0];

      // 3. Unlock all PENDING_CLAIM points to AVAILABLE
      const unlockedRes = await client.query(
        `UPDATE reward_points 
         SET status = 'AVAILABLE' 
         WHERE user_id = $1 AND status = 'PENDING_CLAIM'
         RETURNING points`,
        [user.id]
      );
      const unlockedCount = unlockedRes.rows.reduce((sum, r) => sum + r.points, 0);

      // 4. Create 45-day persistent session token
      const rawSessionToken = crypto.randomBytes(40).toString('hex');
      const tokenHash = hashString(rawSessionToken);
      const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      return { user, rawSessionToken, unlockedCount };
    });

    const response = NextResponse.json({
      success: true,
      user: result.user,
      unlockedPoints: result.unlockedCount,
      message: 'Account created successfully! Your reward points are now active.',
    });

    // Set 45-day secure session cookie
    response.cookies.set('leu_session_token', result.rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 45 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 400 });
  }
}