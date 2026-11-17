// app/api/auth/addresses/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withTransaction, getDb } from '@/lib/db';

export async function POST(req) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('leu_user_session')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      recipient_name,
      phone,
      address_line1,
      address_line2 = '',
      landmark = '',
      city,
      state,
      postal_code,
      is_default = false,
    } = body;

    if (!recipient_name || !address_line1 || !city || !state || !postal_code) {
      return NextResponse.json({ error: 'Please fill all required address fields' }, { status: 400 });
    }

    const newAddress = await withTransaction(async (client) => {
      if (is_default) {
        await client.query(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
      }

      const res = await client.query(
        `INSERT INTO addresses 
         (user_id, recipient_name, phone, address_line1, address_line2, landmark, city, state, postal_code, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          recipient_name.trim(),
          (phone || '').trim(),
          address_line1.trim(),
          address_line2.trim(),
          landmark.trim(),
          city.trim(),
          state.trim(),
          postal_code.trim(),
          Boolean(is_default),
        ]
      );
      return res.rows[0];
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to save address' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('leu_user_session')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const addressId = searchParams.get('id');

  const db = getDb();
  await db.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [addressId, userId]);
  return NextResponse.json({ success: true });
}