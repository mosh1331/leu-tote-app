// app/api/orders/create/route.js
import { NextResponse } from 'next/server';
import { withTransaction, getDb } from '@/lib/db';
import { sendOrderAdminAlert } from '@/lib/ntfy';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      items, // Array of { variantId, quantity }
      referralCode,
      redeemPoints = 0,
    } = body;

    if (!phone || !fullName || !addressLine1 || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required checkout details' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      // 1. Fetch store rules
      const settingsRes = await client.query(
        "SELECT value FROM store_settings WHERE key = 'points_rule'"
      );
      const pointsRule = settingsRes.rows[0]?.value || {
        max_redemption_percent: 20,
        points_per_currency_spent: 0.05,
      };

      // 2. Upsert guest user by phone
      const userRes = await client.query(
        `INSERT INTO users (phone, full_name, email, is_registered)
         VALUES ($1, $2, $3, FALSE)
         ON CONFLICT (phone) DO UPDATE 
         SET full_name = COALESCE(EXCLUDED.full_name, users.full_name),
             email = COALESCE(EXCLUDED.email, users.email)
         RETURNING id, is_registered`,
        [phone, fullName, email || null]
      );
      const userId = userRes.rows[0].id;
      const isRegistered = userRes.rows[0].is_registered;

      // 3. Upsert shipping address
      const addrRes = await client.query(
        `INSERT INTO addresses (user_id, recipient_name, phone, address_line1, address_line2, city, state, postal_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [userId, fullName, phone, addressLine1, addressLine2 || '', city, state, postalCode]
      );
      const addressId = addrRes.rows[0].id;

      // 4. Calculate subtotal and atomically decrement inventory
      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const variantRes = await client.query(
          `UPDATE product_variants 
           SET stock_quantity = stock_quantity - $1 
           WHERE id = $2 AND stock_quantity >= $1 AND is_active = TRUE 
           RETURNING id, offer_price, stock_quantity`,
          [item.quantity, item.variantId]
        );

        if (variantRes.rowCount === 0) {
          throw new Error(`Variant ID ${item.variantId} is out of stock or unavailable`);
        }

        const variant = variantRes.rows[0];
        const itemTotal = Number(variant.offer_price) * item.quantity;
        subtotal += itemTotal;
        validatedItems.push({
          variantId: variant.id,
          unitPrice: variant.offer_price,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });
      }

      // 5. Calculate point redemption & discount caps
      let pointsToRedeem = 0;
      let discountAmount = 0;

      if (redeemPoints > 0 && isRegistered) {
        // Check available balance
        const balanceRes = await client.query(
          `SELECT COALESCE(SUM(points), 0) AS balance 
           FROM reward_points 
           WHERE user_id = $1 AND status = 'AVAILABLE'`,
          [userId]
        );
        const availableBalance = Number(balanceRes.rows[0]?.balance || 0);
        const maxDiscountAllowed = Math.floor((subtotal * pointsRule.max_redemption_percent) / 100);

        pointsToRedeem = Math.min(redeemPoints, availableBalance, maxDiscountAllowed);
        discountAmount = pointsToRedeem; // 1 point = 1 INR
      }

      const normalizedState = (state || '').trim().toLowerCase();
      const shippingCharge = normalizedState === 'kerala' ? 69 : 99;

      const finalPayable = Math.max(subtotal + shippingCharge - discountAmount, 1);
      const pointsEarned = Math.round(finalPayable * (pointsRule.points_per_currency_spent || 0.05));

      // 6. Create order record
      const orderRes = await client.query(
        `INSERT INTO orders (
           user_id, shipping_address_id, subtotal, discount_amount, final_payable, 
           payment_status, status, points_earned, points_redeemed
         ) VALUES ($1, $2, $3, $4, $5, 'UNPAID', 'PENDING', $6, $7)
         RETURNING id`,
        [userId, addressId, subtotal, discountAmount, finalPayable, pointsEarned, pointsToRedeem]
      );
      const orderId = orderRes.rows[0].id;

      // 7. Insert order items
      for (const item of validatedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.variantId, item.quantity, item.unitPrice, item.totalPrice]
        );
      }

      // 8. Reward Points Ledgers
      // A. Points earned by purchaser (PENDING_CLAIM for guests, AVAILABLE if registered)
      const pointStatus = isRegistered ? 'AVAILABLE' : 'PENDING_CLAIM';
      await client.query(
        `INSERT INTO reward_points (user_id, points, status, source, reference_order_id)
         VALUES ($1, $2, $3, 'PURCHASE', $4)`,
        [userId, pointsEarned, pointStatus, orderId]
      );

      // B. Points redeemed deduction
      if (pointsToRedeem > 0) {
        await client.query(
          `INSERT INTO reward_points (user_id, points, status, source, reference_order_id)
           VALUES ($1, $2, 'REDEEMED', 'REDEMPTION', $3)`,
          [userId, -pointsToRedeem, orderId]
        );
      }

      // C. Referral Attribution
      if (referralCode) {
        const referrerRes = await client.query(
          'SELECT id FROM users WHERE referral_code = $1 AND id != $2',
          [referralCode.trim().toUpperCase(), userId]
        );

        if (referrerRes.rowCount > 0) {
          const referrerId = referrerRes.rows[0].id;
          // Set vesting for 7 days (return window)
          await client.query(
            `INSERT INTO reward_points (user_id, points, status, source, reference_order_id, unlocks_at)
             VALUES ($1, 100, 'VESTING', 'REFERRAL_BONUS', $2, NOW() + INTERVAL '7 days')`,
            [referrerId, orderId]
          );
        }
      }

      return { orderId, finalPayable, pointsEarned };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('Order placement failure:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}