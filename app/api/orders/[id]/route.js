// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req, { params }) {
  const { id } = await params;

  // 1. Reject invalid or non-UUID strings immediately
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid order link' }, { status: 400 });
  }

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
        o.payment_transaction_id,
        o.points_earned,
        o.points_redeemed,
        o.courier_name,
        o.tracking_id,
        o.tracking_url,
        o.created_at,
        u.full_name,
        u.phone,
        u.is_registered,
        a.recipient_name,
        a.address_line1,
        a.address_line2,
        a.landmark,
        a.city,
        a.state,
        a.postal_code,
        json_agg(
          json_build_object(
            'item_id', oi.id,
            'title', p.title,
            'slug', p.slug,
            'size', pv.size_label,
            'color', pv.color_label,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'image_url', (
              SELECT image_url FROM product_images pi 
              WHERE pi.product_id = p.id 
              ORDER BY pi.is_primary DESC, pi.display_order ASC 
              LIMIT 1
            )
          )
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.shipping_address_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE o.id = $1
      GROUP BY 
        o.id, u.full_name, u.phone, u.is_registered,
        a.recipient_name, a.address_line1, a.address_line2, 
        a.landmark, a.city, a.state, a.postal_code;
    `;

    const res = await db.query(query, [id]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const row = res.rows[0];

    // 2. Mask phone number for privacy on public URLs
    const rawPhone = row.phone || '';
    const maskedPhone =
      rawPhone.length >= 4 ? `••••••${rawPhone.slice(-4)}` : '••••••';

    return NextResponse.json({
      order: {
        ...row,
        phone: maskedPhone,
      },
    });
  } catch (error) {
    console.error('[PUBLIC ORDER GET ERROR]:', error);
    return NextResponse.json({ error: 'Unable to load order details' }, { status: 500 });
  }
}