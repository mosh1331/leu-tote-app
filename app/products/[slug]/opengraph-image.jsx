// app/products/[slug]/opengraph-image.jsx
import { ImageResponse } from 'next/og';
import { getDb } from '@/lib/db';
import { STORE_INFO } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Leu Tote Product Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  let product = null;

  if (slug) {
    try {
      const db = getDb();
      const res = await db.query(
        `SELECT 
          p.id, 
          p.title, 
          p.description,
          p.category,
          COALESCE(
            json_agg(DISTINCT pv.*) FILTER (WHERE pv.id IS NOT NULL), 
            '[]'
          ) AS variants,
          COALESCE(
            json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL), 
            '[]'
          ) AS images
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
         LEFT JOIN product_images pi ON pi.product_id = p.id
         WHERE p.slug = $1 AND p.is_active = TRUE
         GROUP BY p.id 
         LIMIT 1;`,
        [slug]
      );
      product = res.rows[0];
    } catch (e) {
      console.error('[OG Image Generation DB Error]:', e);
    }
  }

  const title = product?.title || 'Handcrafted Artisan Tote';
  const primaryVariant = product?.variants?.[0] || {};
  const offerPrice = Number(primaryVariant.offer_price || 2100);

  // Sort images to prioritize the primary cover photo
  const sortedImages = [...(product?.images || [])].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  const imageUrl =
    sortedImages[0]?.image_url ||
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&auto=format&fit=crop&q=80';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#1A202C',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Full-bleed ~90% Product Showcase Photo */}
        <img
          src={imageUrl}
          alt={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Ambient Dark Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundImage:
              'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.45) 45%, rgba(0, 0, 0, 0.2) 100%)',
          }}
        />

        {/* Top Floating Badge */}
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 44,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            padding: '8px 18px',
            borderRadius: '100px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#1A202C',
              letterSpacing: '1.5px',
            }}
          >
            {STORE_INFO.name} · Studio Handcrafted
          </span>
        </div>

        {/* Bottom Information Container */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: 44,
            right: 44,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            {/* Bag Title */}
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '72%' }}>
              <h1
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  margin: 0,
                  lineHeight: 1.15,
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {title}
              </h1>
            </div>

            {/* Price Badge (Offer Price Only) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#1A202C',
                  letterSpacing: '-1px',
                }}
              >
                ₹{offerPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Shipping Offer Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '10px 22px',
              borderRadius: '12px',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.4px',
                }}
              >
                🚚 All Kerala shipping @ ₹69 only | All India @ ₹99
              </span>
            </div>
{/* 
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: '#68D391',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              GRAB YOURS NOW ↗
            </span> */}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}