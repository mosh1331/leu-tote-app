// app/api/orders/verify-payment/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withTransaction } from '@/lib/db';

// Helper to push admin alerts to ntfy safely without header encoding crashes
async function sendAdminNtfyAlert({ title, message, priority = 'urgent', tags = 'bell', clickUrl }) {
  const topic = process.env.NTFY_TOPIC;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!topic) {
    console.warn('[NTFY WARNING] NTFY_TOPIC is not set in environment variables.');
    return;
  }

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority,
        'Tags': tags,
        'Click': clickUrl || `${baseUrl}/admin`,
      },
      body: message,
    });
  } catch (err) {
    console.error('[NTFY DISPATCH ERROR]:', err);
  }
}

export async function POST(req) {
  let requestOrderId = null;

  try {
    const body = await req.json();
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;
    requestOrderId = orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Verify HMAC-SHA256 signature if using Razorpay Order IDs
    if (razorpayOrderId && razorpaySignature && secret) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        // Trigger Admin Alert: Tampered or invalid signature
        await sendAdminNtfyAlert({
          title: `Payment Failed: Invalid Signature (#${orderId.slice(0, 8).toUpperCase()})`,
          message: `Order #${orderId}\nReason: Signature mismatch or tampering.\nRazorpay Order: ${razorpayOrderId}`,
          priority: 'high',
          tags: 'warning,rotating_light',
        });

        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // 2. Atomically update order to PAID and gather details for notifications
    const confirmedOrder = await withTransaction(async (client) => {
      const updateRes = await client.query(
        `UPDATE orders 
         SET payment_status = 'PAID',
             status = 'PAID',
             payment_transaction_id = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, final_payable, user_id, shipping_address_id`,
        [razorpayPaymentId || 'PAID_DIRECT', orderId]
      );

      if (updateRes.rowCount === 0) {
        throw new Error(`Order #${orderId} not found in database`);
      }

      // Fetch customer, address, and line item counts for clean notification
      const infoRes = await client.query(
        `SELECT 
           o.final_payable,
           o.points_earned,
           u.full_name,
           u.phone,
           a.city,
           a.state,
           (SELECT COALESCE(SUM(quantity), 1) FROM order_items WHERE order_id = o.id) AS total_items
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN addresses a ON a.id = o.shipping_address_id
         WHERE o.id = $1`,
        [orderId]
      );

      const orderData = infoRes.rows[0];

      // Audit log customer WhatsApp confirmation event
      if (orderData) {
        await client.query(
          `INSERT INTO notifications_log (order_id, recipient_phone, channel, event_type, payload, status)
           VALUES ($1, $2, 'WHATSAPP', 'ORDER_CONFIRMATION', $3, 'PENDING')`,
          [
            orderId,
            orderData.phone,
            JSON.stringify({
              name: orderData.full_name,
              amount: orderData.final_payable,
              trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${orderId}`,
            }),
          ]
        );
      }

      return orderData;
    });

    // 3. Trigger SUCCESS Admin Notification
    const shortId = orderId.slice(0, 8).toUpperCase();
    const cleanPhone = (confirmedOrder?.phone || '').replace(/\D/g, '').slice(-10);
    const amountFormatted = Number(confirmedOrder?.final_payable || 0).toLocaleString();

    await sendAdminNtfyAlert({
      title: `Order Paid: Rs. ${amountFormatted} (#${shortId})`,
      message: `Customer: ${confirmedOrder?.full_name || 'Customer'} (${cleanPhone})\nLocation: ${confirmedOrder?.city || ''}, ${confirmedOrder?.state || ''}\nItems: ${confirmedOrder?.total_items || 1} bag(s)\nTxn ID: ${razorpayPaymentId || 'Direct'}`,
      priority: 'urgent',
      tags: 'tada,shopping_bags',
      clickUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin`,
    });

    return NextResponse.json({ success: true, message: 'Payment confirmed successfully' });

  } catch (error) {
    console.error('Payment verification error:', error);

    // 4. Trigger FAILURE Admin Notification with the exact error details
    const failedOrderId = requestOrderId ? requestOrderId.slice(0, 8).toUpperCase() : 'UNKNOWN';
    await sendAdminNtfyAlert({
      title: `Payment Failed: Order #${failedOrderId}`,
      message: `Error: ${error.message || 'Payment processing error'}\nOrder: ${requestOrderId || 'N/A'}\nStatus: Verification Aborted`,
      priority: 'high',
      tags: 'x,warning',
      clickUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin`,
    });

    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}