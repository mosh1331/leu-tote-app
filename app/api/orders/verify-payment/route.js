// app/api/orders/verify-payment/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withTransaction, getDb } from '@/lib/db';

export async function POST(req) {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const secret = process.env.NEXT_RAZORPAY_KEY_SECRET;

    // Verify HMAC-SHA256 signature if using Razorpay Order IDs
    if (razorpayOrderId && razorpaySignature && secret) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Update order status atomically
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE orders 
         SET payment_status = 'PAID',
             status = 'PAID',
             payment_transaction_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [razorpayPaymentId || 'PAID_MOCK', orderId]
      );

      // Log WhatsApp event in notifications_log
      const orderInfo = await client.query(
        `SELECT o.final_payable, u.phone, u.full_name
         FROM orders o
         JOIN users u ON u.id = o.user_id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderInfo.rows[0]) {
        const { phone, full_name, final_payable } = orderInfo.rows[0];
        await client.query(
          `INSERT INTO notifications_log (order_id, recipient_phone, channel, event_type, payload)
           VALUES ($1, $2, 'WHATSAPP', 'ORDER_CONFIRMATION', $3)`,
          [
            orderId,
            phone,
            JSON.stringify({
              name: full_name,
              amount: final_payable,
              trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${orderId}`,
            }),
          ]
        );
      }
    });

    return NextResponse.json({ success: true, message: 'Payment confirmed' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}