// app/api/admin/orders/route.js
import { NextResponse } from 'next/server';
import { withTransaction, getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  try {
    const res = await db.query(`
      SELECT 
        o.*,
        u.phone AS customer_phone,
        u.full_name AS customer_name,
        a.address_line1, a.city, a.postal_code,
        json_agg(json_build_object(
          'item_id', oi.id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price,
          'variant_id', oi.product_variant_id
        )) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.shipping_address_id
      JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, u.phone, u.full_name, a.address_line1, a.city, a.postal_code
      ORDER BY o.created_at DESC;
    `);
    return NextResponse.json({ orders: res.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update order status with cancellation point clawback
export async function PATCH(req) {
  try {
    const { orderId, status } = await req.json();

    await withTransaction(async (client) => {
      await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, orderId]);

      // If cancelled or returned, reverse rewards and claw back referral bonuses
      if (status === 'CANCELLED' || status === 'RETURNED') {
        // Reverse purchaser earned points
        await client.query(
          `UPDATE reward_points 
           SET status = 'REVERSED' 
           WHERE reference_order_id = $1 AND source = 'PURCHASE'`,
          [orderId]
        );

        // Reverse referrer vesting bonus
        await client.query(
          `UPDATE reward_points 
           SET status = 'REVERSED' 
           WHERE reference_order_id = $1 AND source = 'REFERRAL_BONUS'`,
          [orderId]
        );
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}