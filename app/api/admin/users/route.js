// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  try {
    const query = `
      SELECT 
        u.id,
        u.phone,
        u.full_name,
        u.email,
        u.is_registered,
        u.referral_code,
        u.created_at,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.final_payable), 0) AS lifetime_spend,
        COUNT(DISTINCT w.id) AS wishlist_count,
        (
          SELECT COUNT(*) 
          FROM reward_points rp_ref 
          WHERE rp_ref.user_id = u.id AND rp_ref.source = 'REFERRAL_BONUS'
        ) AS successful_referrals,
        (
          SELECT COALESCE(SUM(points), 0) 
          FROM reward_points rp_bal 
          WHERE rp_bal.user_id = u.id AND rp_bal.status = 'AVAILABLE'
        ) AS available_points,
        (
          SELECT json_agg(json_build_object(
            'order_id', o_sub.id,
            'final_payable', o_sub.final_payable,
            'points_redeemed', o_sub.points_redeemed,
            'status', o_sub.status,
            'date', o_sub.created_at
          ))
          FROM orders o_sub 
          WHERE o_sub.user_id = u.id
        ) AS purchases
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN wishlist w ON w.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC;
    `;
    const res = await db.query(query);
    return NextResponse.json({ users: res.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}