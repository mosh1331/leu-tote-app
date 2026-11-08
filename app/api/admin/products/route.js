// app/api/admin/products/route.js
import { NextResponse } from 'next/server';
import { withTransaction, getDb } from '@/lib/db';
import ImageKit from 'imagekit';

// Initialize ImageKit with server credentials
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export const dynamic = 'force-dynamic';

// Helper: Standardized slug generation
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ==============================================================================
// 1. GET: Fetch all products (Live & Drafts) for Admin
// ==============================================================================
export async function GET() {
  const db = getDb();
  try {
    const query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.description,
        p.category,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pv.id,
              'size_label', pv.size_label,
              'color_label', pv.color_label,
             'cost_price', COALESCE(pv.cost_price, 0.00),
              'sku', pv.sku,
              'selling_price', pv.selling_price,
              'offer_price', pv.offer_price,
              'stock_quantity', pv.stock_quantity,
              'is_active', pv.is_active
            )
          ) FILTER (WHERE pv.id IS NOT NULL), '[]'
        ) AS variants,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'file_id', pi.file_id,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'display_order', pi.display_order
            )
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    const res = await db.query(query);
    return NextResponse.json({ products: res.rows }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN PRODUCTS GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
  }
}

// ==============================================================================
// 2. POST: Create Product with Variants & ImageKit URLs
// ==============================================================================
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      description = '',
      category = 'Tote Bags',
      isActive = true,
      variants = [],
      images = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
    }

    const cleanSlug = slugify(slug || title);

    const result = await withTransaction(async (client) => {
      // 1. Verify slug uniqueness
      const existingSlug = await client.query('SELECT id FROM products WHERE slug = $1', [cleanSlug]);
      const finalSlug = existingSlug.rowCount > 0 ? `${cleanSlug}-${Date.now().toString().slice(-4)}` : cleanSlug;

      // 2. Insert Base Product
      const productRes = await client.query(
        `INSERT INTO products (title, slug, description, category, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, slug, is_active`,
        [title.trim(), finalSlug, description.trim(), category, Boolean(isActive)]
      );
      const product = productRes.rows[0];

      if (variants.length > 0) {
        for (const v of variants) {
          const sku = v.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO product_variants 
         (product_id, size_label, color_label, sku, selling_price, offer_price, cost_price, stock_quantity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
            [
              product.id,
              v.size_label || 'Standard',
              v.color_label || null,
              sku,
              Number(v.selling_price) || 0,
              Number(v.offer_price) || 0,
              Number(v.cost_price) || 0, // <-- Added cost_price
              Number(v.stock_quantity) || 0,
            ]
          );
        }
    } else {
      // Fallback default variant if not supplied
      await client.query(
        `INSERT INTO product_variants 
           (product_id, size_label, sku, selling_price, offer_price, stock_quantity, is_active)
           VALUES ($1, 'Standard', $2, 0, 0, 0, TRUE)`,
        [product.id, `SKU-${Date.now()}`]
      );
    }

      // 4. Insert Images (Storing file_id for CDN cleanup)
      if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img?.image_url) {
          await client.query(
            `INSERT INTO product_images 
               (product_id, image_url, file_id, alt_text, display_order, is_primary)
               VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              product.id,
              img.image_url,
              img.file_id || null,
              img.alt_text || product.title,
              i,
              Boolean(img.is_primary ?? i === 0),
            ]
          );
        }
      }
    }

    return product;
  });

  return NextResponse.json({ success: true, product: result }, { status: 201 });
} catch (error) {
  console.error('[ADMIN PRODUCTS POST] Error:', error);
  return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
}
}

// ==============================================================================
// 3. PUT: Full Product Update (Title, Details, Variants & Images Sync)
// ==============================================================================
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      slug,
      description,
      category,
      isActive,
      variants = [],
      images = [],
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const cleanSlug = slugify(slug || title);

    await withTransaction(async (client) => {
      // 1. Update Core Product Details
      await client.query(
        `UPDATE products 
         SET title = COALESCE($1, title),
             slug = COALESCE($2, slug),
             description = COALESCE($3, description),
             category = COALESCE($4, category),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE id = $6`,
        [title?.trim(), cleanSlug, description, category, isActive, id]
      );

      // 2. Synchronize Variants if provided
      if (variants.length > 0) {
        // Remove old variants and insert updated variant set
        await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        for (const v of variants) {
          const sku = v.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO product_variants 
     (product_id, size_label, color_label, sku, selling_price, offer_price, cost_price, stock_quantity, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
            [
              productId,
              v.size_label || 'Standard',
              v.color_label || null,
              sku,
              Number(v.selling_price) || 0,
              Number(v.offer_price) || 0,
              Number(v.cost_price) || 0, // Persist COGS
              Number(v.stock_quantity) || 0,
            ]
          );
        }
      }

      // 3. Synchronize Images & Clean Up Removed Assets from ImageKit
      if (images.length > 0) {
        // Fetch current file_ids in DB
        const existingImagesRes = await client.query(
          'SELECT file_id FROM product_images WHERE product_id = $1 AND file_id IS NOT NULL',
          [id]
        );
        const currentFileIds = existingImagesRes.rows.map((r) => r.file_id).filter(Boolean);
        const incomingFileIds = images.map((img) => img.file_id).filter(Boolean);

        // Find file_ids that were removed in the edit
        const removedFileIds = currentFileIds.filter((fid) => !incomingFileIds.includes(fid));

        // Purge deleted files from ImageKit
        if (removedFileIds.length > 0) {
          try {
            if (removedFileIds.length === 1) {
              await imagekit.deleteFile(removedFileIds[0]);
            } else {
              await imagekit.bulkDeleteFiles(removedFileIds);
            }
          } catch (ikErr) {
            console.error('[IMAGEKIT EDIT PURGE ERROR]:', ikErr);
          }
        }

        // Re-sync image records in PostgreSQL
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img?.image_url) {
            await client.query(
              `INSERT INTO product_images 
               (product_id, image_url, file_id, alt_text, display_order, is_primary)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                id,
                img.image_url,
                img.file_id || null,
                img.alt_text || title || 'Product Image',
                i,
                Boolean(img.is_primary ?? i === 0),
              ]
            );
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Product updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN PRODUCTS PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

// ==============================================================================
// 4. PATCH: Granular Toggles (Publish / Draft, Stock Restock / Sold Out)
// ==============================================================================
export async function PATCH(req) {
  const db = getDb();
  try {
    const { id, isActive, stockQuantity, variantId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Toggle Publish / Draft
    if (typeof isActive === 'boolean') {
      await db.query(
        'UPDATE products SET is_active = $1, updated_at = NOW() WHERE id = $2',
        [isActive, id]
      );
    }

    // Mark Sold Out (0) or Restock (>0)
    if (stockQuantity !== undefined) {
      if (variantId) {
        // Target specific variant
        await db.query(
          'UPDATE product_variants SET stock_quantity = $1 WHERE id = $2 AND product_id = $3',
          [Number(stockQuantity), variantId, id]
        );
      } else {
        // Target all variants of the product
        await db.query(
          'UPDATE product_variants SET stock_quantity = $1 WHERE product_id = $2',
          [Number(stockQuantity), id]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Status updated' }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN PRODUCTS PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

// ==============================================================================
// 5. DELETE: Purge Product from Neon DB & Clean ImageKit Files
// ==============================================================================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required in query params (?id=...)' }, { status: 400 });
    }

    const db = getDb();

    // 1. Fetch file_ids associated with this product before cascade delete
    const imgRes = await db.query(
      'SELECT file_id FROM product_images WHERE product_id = $1 AND file_id IS NOT NULL',
      [productId]
    );

    const fileIds = imgRes.rows.map((r) => r.file_id).filter(Boolean);

    // 2. Delete files from ImageKit
    if (fileIds.length > 0) {
      try {
        if (fileIds.length === 1) {
          await imagekit.deleteFile(fileIds[0]);
        } else {
          await imagekit.bulkDeleteFiles(fileIds);
        }
      } catch (ikErr) {
        console.error('[IMAGEKIT DELETE PURGE ERROR]:', ikErr);
        // Continue with database deletion even if CDN cleanup experiences an issue
      }
    }

    // 3. Delete from DB (Foreign keys ON DELETE CASCADE clean product_variants, product_images, wishlist)
    const delRes = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [productId]);

    if (delRes.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product and associated CDN images removed',
      deletedFilesCount: fileIds.length,
    }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN PRODUCTS DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}