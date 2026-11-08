// app/api/admin/orders/offline/route.js
import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      customerName = 'Walk-in Customer',
      customerPhone,
      paymentMethod = 'CASH', // 'CASH', 'UPI', 'CARD'
      discountAmount = 0,
      offlineNotes = '',
      items = [], // Array of { variantId, quantity, customUnitPrice? }
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Please select at least one bag' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      // 1. Resolve or create user if phone provided, else use walk-in anchor
      let userId;
      const cleanPhone = customerPhone?.replace(/\D/g, '').slice(-10);

      if (cleanPhone && cleanPhone.length === 10) {
        const uRes = await client.query(
          `INSERT INTO users (phone, full_name, is_registered)
           VALUES ($1, $2, FALSE)
           ON CONFLICT (phone) DO UPDATE 
           SET full_name = COALESCE(users.full_name, EXCLUDED.full_name)
           RETURNING id`,
          [cleanPhone, customerName]
        );
        userId = uRes.rows[0].id;
      } else {
        // Fallback dedicated offline retail guest user
        const guestRes = await client.query(
          `INSERT INTO users (phone, full_name, is_registered)
           VALUES ('0000000000', 'Walk-in Customer', FALSE)
           ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
           RETURNING id`
        );
        userId = guestRes.rows[0].id;
      }

      // 2. Validate items, decrement stock, and capture COGS
      let subtotal = 0;
      let totalCogs = 0;
      const validatedItems = [];

      for (const item of items) {
        const qty = Number(item.quantity || 1);
        const variantRes = await client.query(
          `UPDATE product_variants 
           SET stock_quantity = stock_quantity - $1 
           WHERE id = $2 AND stock_quantity >= $1 
           RETURNING id, product_id, offer_price, COALESCE(cost_price, 0.00) AS cost_price, stock_quantity`,
          [qty, item.variantId]
        );

        if (variantRes.rowCount === 0) {
          throw new Error(`Insufficient stock for selected item`);
        }

        const variant = variantRes.rows[0];
        const unitPrice = item.customUnitPrice !== undefined ? Number(item.customUnitPrice) : Number(variant.offer_price);
        const unitCost = Number(variant.cost_price);
        const itemTotal = unitPrice * qty;

        subtotal += itemTotal;
        totalCogs += unitCost * qty;

        validatedItems.push({
          variantId: variant.id,
          unitPrice,
          costPrice: unitCost,
          quantity: qty,
          totalPrice: itemTotal,
        });
      }

      const finalDiscount = Math.min(Number(discountAmount || 0), subtotal);
      const finalPayable = Math.max(subtotal - finalDiscount, 0);

      // 3. Create Offline Order Record
      const orderRes = await client.query(
        `INSERT INTO orders (
           user_id, subtotal, discount_amount, shipping_charge, final_payable,
           payment_status, status, channel, payment_method, offline_notes
         ) VALUES ($1, $2, $3, 0.00, $4, 'PAID', 'DELIVERED', 'OFFLINE', $5, $6)
         RETURNING id`,
        [userId, subtotal, finalDiscount, finalPayable, paymentMethod, offlineNotes]
      );
      const orderId = orderRes.rows[0].id;

      // 4. Insert Order Items with COGS snapshot
      for (const item of validatedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price, cost_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.variantId, item.quantity, item.unitPrice, item.costPrice, item.totalPrice]
        );
      }

      return { orderId, subtotal, finalPayable, totalCogs, profit: finalPayable - totalCogs };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}