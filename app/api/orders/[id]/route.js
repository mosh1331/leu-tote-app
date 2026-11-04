// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req, { params }) {
  const { id } = await params;
  const db = getDb();

  try {
    const res = await db.query(
      `SELECT 
        o.id,
        o.subtotal,
        o.discount_amount,
        o.final_payable,
        o.status,
        o.payment_status,
        o.points_earned,
        o.points_redeemed,
        o.created_at,
        u.full_name,
        u.phone,
        u.email,
        u.is_registered,
        u.referral_code,
        a.recipient_name,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.postal_code,
        json_agg(
          json_build_object(
            'item_id', oi.id,
            'title', p.title,
            'size', pv.size_label,
            'color', pv.color_label,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ) AS items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.shipping_address_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN product_variants pv ON pv.id = oi.product_variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE o.id = $1
       GROUP BY o.id, u.full_name, u.phone, u.email, u.is_registered, u.referral_code,
                a.recipient_name, a.address_line1, a.address_line2, a.city, a.state, a.postal_code`,
      [id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order: res.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}