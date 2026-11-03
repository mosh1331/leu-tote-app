// app/api/admin/products/route.js
import { NextResponse } from 'next/server';
import { withTransaction, getDb } from '@/lib/db';

// 1. GET: Fetch all products (drafts and published) for admin table
export async function GET() {
  const db = getDb();
  try {
    const query = `
      SELECT 
        p.*,
        COALESCE(json_agg(DISTINCT pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') AS variants,
        COALESCE(json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    const res = await db.query(query);
    return NextResponse.json({ products: res.rows });
  } catch (error) {
    console.error('Failed to fetch admin products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Add new product with variants & images
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      description,
      category = 'Totes',
      isActive = true,
      variants = [],
      images = [],
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const generatedSlug = slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const result = await withTransaction(async (client) => {
      // Insert product
      const pRes = await client.query(
        `INSERT INTO products (title, slug, description, category, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [title, generatedSlug, description || '', category, isActive]
      );
      const productId = pRes.rows[0].id;

      // Insert variants (pricing and stock)
      if (variants.length > 0) {
        for (const v of variants) {
          const sku = v.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO product_variants 
             (product_id, size_label, color_label, sku, selling_price, offer_price, stock_quantity, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
            [
              productId,
              v.size_label || null,
              v.color_label || null,
              sku,
              Number(v.selling_price) || 0,
              Number(v.offer_price) || 0,
              Number(v.stock_quantity) || 0,
            ]
          );
        }
      }

      // Insert primary image
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          if (images[i]?.image_url) {
            await client.query(
              `INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
               VALUES ($1, $2, $3, $4, $5)`,
              [productId, images[i].image_url, images[i].alt_text || title, i, i === 0]
            );
          }
        }
      }

      return { productId, slug: generatedSlug };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PATCH: Toggle Draft / Published status
export async function PATCH(req) {
  const db = getDb();
  try {
    const { id, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await db.query(
      'UPDATE products SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [isActive, id]
    );

    return NextResponse.json({ success: true, is_active: isActive });
  } catch (error) {
    console.error('Failed to update status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}