// app/api/products/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const db = getDb();
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('cat');
    const query = searchParams.get('q');

    let sql = `
      SELECT 
        p.id, p.title, p.slug, p.description, p.category,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pv.id,
              'size_label', pv.size_label,
              'color_label', pv.color_label,
              'selling_price', pv.selling_price,
              'offer_price', pv.offer_price,
              'stock_quantity', pv.stock_quantity
            )
          ) FILTER (WHERE pv.id IS NOT NULL), '[]'
        ) AS variants,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary
            )
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.is_active = TRUE
    `;

    const params = [];
    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND LOWER(p.category) = LOWER($${params.length})`;
    }
    if (query) {
      params.push(`%${query}%`);
      sql += ` AND (LOWER(p.title) LIKE LOWER($${params.length}) OR LOWER(p.description) LIKE LOWER($${params.length}))`;
    }

    sql += ` GROUP BY p.id ORDER BY p.created_at DESC;`;

    const res = await db.query(sql, params);
    return NextResponse.json({ products: res.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}