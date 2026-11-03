// app/api/admin/products/route.js
import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

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

    // Auto-generate a clean slug if one was not provided
    const cleanSlug = (slug?.trim() || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-')         // replace spaces with hyphens
      .replace(/-+/g, '-');        // collapse consecutive hyphens

    const result = await withTransaction(async (client) => {
      // 1. Insert product with auto-generated slug
      const pRes = await client.query(
        `INSERT INTO products (title, slug, description, category, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [title, cleanSlug, description || '', category, isActive]
      );
      const productId = pRes.rows[0].id;

      // 2. Insert variants
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

      // 3. Insert images
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

      return { productId, slug: cleanSlug };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}