// app/api/admin/orders/route.js
import { NextResponse } from 'next/server';
import { withTransaction, getDb } from '@/lib/db';
import { sendOrderShippedWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  try {
    const res = await db.query(`
      SELECT 
        o.*,
        u.phone AS customer_phone,
        u.full_name AS customer_name,
        a.address_line1,
        a.city,
        a.postal_code,
        a.state,
        -- Total Cost of Goods Sold (COGS) for this specific order
        COALESCE(
          SUM(COALESCE( pv.cost_price, 0.00) * oi.quantity),
          0.00
        ) AS total_order_cost,
        -- Gross profit before courier/gateway fees
        COALESCE(
          o.final_payable - SUM(COALESCE(pv.cost_price, 0.00) * oi.quantity),
          o.final_payable
        ) AS gross_profit,
        json_agg(
          json_build_object(
            'item_id', oi.id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'cost_price',pv.cost_price,
            'total_price', oi.total_price,
            'line_profit', (oi.unit_price - COALESCE(pv.cost_price, 0.00)) * oi.quantity,
            'variant_id', oi.product_variant_id,
            'size_label', pv.size_label,
            'color_label', pv.color_label
          )
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.shipping_address_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.product_variant_id
      GROUP BY 
        o.id, 
        u.phone, 
        u.full_name, 
        a.address_line1, 
        a.state, 
        a.city, 
        a.postal_code
      ORDER BY o.created_at DESC;
    `);

    return NextResponse.json({ orders: res.rows });
  } catch (err) {
    console.error('[ORDERS GET ERROR]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function PATCH(req) {
  try {
    const { orderId, status, courierName, trackingId, trackingUrl } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and Status required' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      // 1. Update order status and courier info
      const orderRes = await client.query(
        `UPDATE orders 
         SET status = $1, 
             courier_name = COALESCE($2, courier_name),
             tracking_id = COALESCE($3, tracking_id),
             tracking_url = COALESCE($4, tracking_url),
             updated_at = NOW() 
         WHERE id = $5 
         RETURNING id, user_id, status`,
        [status, courierName || null, trackingId || null, trackingUrl || null, orderId]
      );

      if (orderRes.rowCount === 0) throw new Error('Order not found');

      // 2. Fetch customer details with fallback to address phone
      const userRes = await client.query(
        `SELECT 
           COALESCE(u.phone, a.phone) AS phone,
           COALESCE(u.full_name, a.recipient_name, 'Valued Customer') AS full_name
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN addresses a ON a.id = o.shipping_address_id
         WHERE o.id = $1`,
        [orderId]
      );
      const user = userRes.rows[0];

      return { user, order: orderRes.rows[0] };
    });

    // 3. Trigger WhatsApp notification when marked SHIPPED
    let whatsappResult = null;

    if (status === 'SHIPPED') {
      const recipientPhone = result.user?.phone;

      if (!recipientPhone) {
        console.warn(`[WHATSAPP SKIPPED] No phone number associated with Order #${orderId}`);
      } else {
        try {
          whatsappResult = await sendOrderShippedWhatsApp({
            toPhone: recipientPhone,
            customerName: result.user.full_name,
            orderId,
            courierName: courierName || 'India Post / BlueDart / Delhivery',
            trackingId: trackingId || 'N/A',
            trackingUrl,
          });

          console.log('[WHATSAPP DISPATCH RESULT]:', JSON.stringify(whatsappResult, null, 2));

          // Audit log into PostgreSQL notifications_log
          const db = getDb();
          await db.query(
            `INSERT INTO notifications_log (order_id, recipient_phone, channel, event_type, payload, status, provider_response)
             VALUES ($1, $2, 'WHATSAPP', 'SHIPPED_UPDATE', $3, $4, $5)`,
            [
              orderId,
              recipientPhone,
              JSON.stringify({ courierName, trackingId, trackingUrl }),
              whatsappResult?.success ? 'SENT' : 'FAILED',
              JSON.stringify(whatsappResult),
            ]
          );
        } catch (waErr) {
          console.error('[WHATSAPP EXCEPTION]:', waErr);
          whatsappResult = { success: false, error: waErr.message };
        }
      }
    }

    // Return detailed feedback to the admin client
    return NextResponse.json({ 
      success: true, 
      status, 
      whatsapp: whatsappResult 
    });

  } catch (err) {
    console.error('[ORDER STATUS UPDATE ERROR]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}