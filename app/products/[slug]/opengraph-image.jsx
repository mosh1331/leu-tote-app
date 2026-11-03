// app/products/[slug]/opengraph-image.jsx
import { ImageResponse } from 'next/og';
import { PRODUCTS, STORE_INFO } from '@/lib/data';

export const runtime = 'edge';
export const alt = 'Leu Tote Product Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const product = PRODUCTS.find((p) => p.slug === params.slug) || PRODUCTS[0];
  const discountPercent = Math.round(((product.selling_price - product.offer_price) / product.selling_price) * 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#98A78F',
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
          }}
        >
          <div style={{ width: '48%', height: '100%', display: 'flex' }}>
            <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ width: '52%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '50px 45px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#718096' }}>
                {product.brand} · Leu Tote
              </span>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1A202C', marginTop: 12 }}>
                {product.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 24, gap: '16px' }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: '#1A202C' }}>
                  ₹{product.offer_price.toLocaleString()}
                </span>
                <span style={{ fontSize: 28, color: '#A0AEC0', textDecoration: 'line-through' }}>
                  ₹{product.selling_price.toLocaleString()}
                </span>
                {discountPercent > 0 && (
                  <span style={{ backgroundColor: '#E53E3E', color: '#FFFFFF', fontSize: 18, fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F4F5F0', padding: '16px 20px', borderRadius: '16px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, color: '#D69E2E', fontWeight: 800 }}>
                + Earn {product.points_reward} Leu Points
              </span>
              <div style={{ backgroundColor: '#25D366', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: 16, fontWeight: 700 }}>
                Buy on WhatsApp
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}