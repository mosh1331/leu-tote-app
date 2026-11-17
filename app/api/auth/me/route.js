// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('leu_user_session')?.value;

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const db = getDb();

  try {
    // 1. User Profile
    const userRes = await db.query(
      `SELECT id, phone, full_name, email, referral_code, is_registered, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rowCount === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // 2. Points Summary & History
    const pointsSummaryRes = await db.query(
      `SELECT 
         COALESCE(SUM(points) FILTER (WHERE status = 'AVAILABLE'), 0) AS available_points,
         COALESCE(SUM(points) FILTER (WHERE status = 'VESTING'), 0) AS vesting_points
       FROM reward_points WHERE user_id = $1`,
      [userId]
    );

    const pointsLedgerRes = await db.query(
      `SELECT id, points, status, source, reference_order_id, created_at
       FROM reward_points
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    // 3. Saved Addresses
    const addressesRes = await db.query(
      `SELECT id, recipient_name, phone, address_line1, address_line2, landmark, city, state, postal_code, is_default
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    // 4. Past Orders (Online & Offline linked to phone/user_id)
    const ordersRes = await db.query(
      `SELECT 
         o.id,
         o.subtotal,
         o.discount_amount,
         COALESCE(o.shipping_charge, 0) AS shipping_charge,
         o.final_payable,
         o.status,
         o.payment_status,
         o.points_earned,
         o.points_redeemed,
         o.courier_name,
         o.tracking_id,
         o.tracking_url,
         o.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'item_id', oi.id,
               'title', p.title,
               'size', pv.size_label,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'total_price', oi.total_price,
               'image_url', (
                 SELECT image_url FROM product_images pi 
                 WHERE pi.product_id = p.id 
                 ORDER BY pi.is_primary DESC, pi.display_order ASC LIMIT 1
               )
             )
           ) FILTER (WHERE oi.id IS NOT NULL), '[]'
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id
       LEFT JOIN products p ON p.id = pv.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      authenticated: true,
      user: userRes.rows[0],
      points: {
        available: Number(pointsSummaryRes.rows[0]?.available_points || 0),
        vesting: Number(pointsSummaryRes.rows[0]?.vesting_points || 0),
        ledger: pointsLedgerRes.rows,
      },
      addresses: addressesRes.rows,
      orders: ordersRes.rows,
    });
  } catch (error) {
    console.error('[AUTH ME ERROR]:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}