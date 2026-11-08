// app/api/admin/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { id } = await params;
  const db = getDb();

  try {
    const query = `
      SELECT 
        o.id,
        o.subtotal,
        o.discount_amount,
        COALESCE(o.shipping_charge, 0) AS shipping_charge,
        o.final_payable,
        o.status,
        o.payment_status,
        o.payment_method,
        o.channel,
        o.offline_notes,
        o.points_earned,
        o.points_redeemed,
        o.created_at,
        u.id AS user_id,
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email,
        u.is_registered,
        u.referral_code,
        a.recipient_name,
        a.phone AS delivery_phone,
        a.address_line1,
        a.address_line2,
        a.landmark,
        a.city,
        a.state,
        a.postal_code,
        COALESCE(SUM(oi.cost_price * oi.quantity), 0) AS total_order_cost,
        json_agg(
          json_build_object(
            'item_id', oi.id,
            'title', p.title,
            'size', pv.size_label,
            'color', pv.color_label,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'cost_price', oi.cost_price,
            'total_price', oi.total_price,
            'item_profit', (oi.unit_price - oi.cost_price) * oi.quantity
          )
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.shipping_address_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE o.id = $1
      GROUP BY o.id, u.id, u.full_name, u.phone, u.email, u.is_registered, u.referral_code,
               a.recipient_name, a.phone, a.address_line1, a.address_line2, a.landmark, a.city, a.state, a.postal_code;
    `;

    const res = await db.query(query, [id]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}