// app/products/[slug]/opengraph-image.jsx
import { ImageResponse } from 'next/og';
import { getDb } from '@/lib/db';
import { STORE_INFO } from '@/lib/data';

// 1. Use 'nodejs' runtime so standard PostgreSQL/Neon connections work
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Leu Tote Product Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  // Await params for Next.js 15+ compatibility
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

  // Fallbacks if not found
  const title = product?.title || 'Handcrafted Artisan Bag';
  const primaryVariant = product?.variants?.[0] || {};
  const offerPrice = Number(primaryVariant.offer_price || 2200);
  const sellingPrice = Number(primaryVariant.selling_price || offerPrice);
  const discountPercent =
    sellingPrice > offerPrice
      ? Math.round(((sellingPrice - offerPrice) / sellingPrice) * 100)
      : 0;

  // Primary image or first image from the array
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
          backgroundColor: '#98A78F', // themeBg.screen
          padding: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Left: Product Hero Photo */}
          <div
            style={{
              width: '48%',
              height: '100%',
              display: 'flex',
              backgroundColor: '#F8F9FA',
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Right: Dynamic Offer Card */}
          <div
            style={{
              width: '52%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '50px 45px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#718096',
                  letterSpacing: '2px',
                }}
              >
                {STORE_INFO.name} · Studio Handcrafted
              </span>

              <h1
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color: '#1A202C',
                  marginTop: 12,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h1>

              {/* Dynamic Prices */}
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 20, gap: '16px' }}>
                <span
                  style={{
                    fontSize: 46,
                    fontWeight: 900,
                    color: '#1A202C',
                  }}
                >
                  ₹{offerPrice.toLocaleString()}
                </span>
                {sellingPrice > offerPrice && (
                  <span
                    style={{
                      fontSize: 26,
                      color: '#A0AEC0',
                      textDecoration: 'line-through',
                    }}
                  >
                    ₹{sellingPrice.toLocaleString()}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span
                    style={{
                      backgroundColor: '#E53E3E',
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Reward Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F4F5F0',
                padding: '16px 20px',
                borderRadius: '16px',
                border: '1px solid #E9EBE5',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>
                  Customer Rewards Active
                </span>
                <span style={{ fontSize: 16, color: '#D69E2E', fontWeight: 800 }}>
                  + Earn Points on This Order
                </span>
              </div>
              <div
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                Shop via WhatsApp
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}