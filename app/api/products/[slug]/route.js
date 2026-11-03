// app/api/products/[slug]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req, { params }) {
  const db = getDb();
  try {
    const { slug } = params;

    const query = `
      SELECT 
        p.id, p.title, p.slug, p.description, p.category, p.is_active,
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
              'is_primary', pi.is_primary,
              'display_order', pi.display_order
            )
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.slug = $1 AND p.is_active = TRUE
      GROUP BY p.id;
    `;

    const res = await db.query(query, [slug]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found or not published' }, { status: 404 });
    }

    return NextResponse.json({ product: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}