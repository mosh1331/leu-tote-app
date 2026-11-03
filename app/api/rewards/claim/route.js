// app/api/rewards/claim/route.js
import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();

    // Verify OTP logic (mocked for development, replace with your SMS provider)
    if (!phone || otp !== '1234') {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      // 1. Fetch user
      const userRes = await client.query('SELECT id, is_registered, referral_code FROM users WHERE phone = $1', [phone]);
      if (userRes.rowCount === 0) {
        throw new Error('No orders found for this phone number.');
      }

      const user = userRes.rows[0];
      const referralCode = user.referral_code || 'LEU-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      // 2. Upgrade user profile to registered
      await client.query(
        `UPDATE users 
         SET is_registered = TRUE, referral_code = $1, updated_at = NOW() 
         WHERE id = $2`,
        [referralCode, user.id]
      );

      // 3. Unlock PENDING_CLAIM points to AVAILABLE
      const updatePointsRes = await client.query(
        `UPDATE reward_points 
         SET status = 'AVAILABLE' 
         WHERE user_id = $1 AND status = 'PENDING_CLAIM'
         RETURNING points`,
        [user.id]
      );

      const unlockedPoints = updatePointsRes.rows.reduce((sum, row) => sum + row.points, 0);

      // 4. Calculate total available balance
      const balanceRes = await client.query(
        `SELECT COALESCE(SUM(points), 0) AS balance 
         FROM reward_points 
         WHERE user_id = $1 AND status = 'AVAILABLE'`,
        [user.id]
      );

      return {
        userId: user.id,
        referralCode,
        unlockedPoints,
        totalBalance: Number(balanceRes.rows[0].balance),
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}