// app/products/[slug]/page.jsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ProductShareModal from '@/components/ProductShareModal';
import { getDb } from '@/lib/db';
import { STORE_INFO } from '@/lib/data';

// 1. Dynamic SEO Metadata Generation with OpenGraph & Twitter tags
export async function generateMetadata({ params }) {
  // Await params for Next.js 15+ compatibility
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) return {};

  let product = null;
  try {
    const db = getDb();
    const res = await db.query(
      `SELECT p.id, p.title, p.slug, p.description, p.category,
              COALESCE(json_agg(DISTINCT pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') AS variants,
              COALESCE(json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE p.slug = $1 AND p.is_active = TRUE
       GROUP BY p.id LIMIT 1;`,
      [slug]
    );
    product = res.rows[0];
  } catch (err) {
    console.error('Metadata fetch error:', err);
  }

  if (!product) return {};

  const primaryVariant = product.variants?.[0] || {};
  const offerPrice = Number(primaryVariant.offer_price || 0);
  const sellingPrice = Number(primaryVariant.selling_price || offerPrice);
  const discountPercent =
    sellingPrice > offerPrice
      ? Math.round(((sellingPrice - offerPrice) / sellingPrice) * 100)
      : 0;

  const pageTitle = `${product.title} | ${STORE_INFO.name}`;
  const pageDescription = `${product.description || ''} Special Price: ₹${offerPrice.toLocaleString()}${
    discountPercent > 0 ? ` (${discountPercent}% OFF)` : ''
  }. 100% Handmade utility. Fast delivery across India.`;
  const productUrl = `${STORE_INFO.siteUrl}/products/${product.slug}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.title} - ₹${offerPrice.toLocaleString()}${
        discountPercent > 0 ? ` (${discountPercent}% OFF)` : ''
      }`,
      description: pageDescription,
      url: productUrl,
      siteName: STORE_INFO.name,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: `${STORE_INFO.siteUrl}/products/${product.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} - ₹${offerPrice.toLocaleString()}`,
      description: pageDescription,
      images: [`${STORE_INFO.siteUrl}/products/${product.slug}/opengraph-image`],
    },
  };
}

// 2. Product Detail Page
export default async function ProductDetailPage({ params }) {
  // Await params so slug resolves properly
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) notFound();

  const db = getDb();
  let product = null;

  try {
    const res = await db.query(
      `SELECT p.id, p.title, p.slug, p.description, p.category,
              COALESCE(json_agg(DISTINCT pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') AS variants,
              COALESCE(json_agg(DISTINCT pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE p.slug = $1 AND p.is_active = TRUE
       GROUP BY p.id LIMIT 1;`,
      [slug]
    );
    product = res.rows[0];
  } catch (err) {
    console.error('Failed to query product by slug:', err);
  }

  if (!product) notFound();

  const primaryVariant = product.variants?.[0] || {};
  const offerPrice = Number(primaryVariant.offer_price || 0);
  const sellingPrice = Number(primaryVariant.selling_price || offerPrice);
  const stock = Number(primaryVariant.stock_quantity || 0);
  const discountPercent =
    sellingPrice > offerPrice
      ? Math.round(((sellingPrice - offerPrice) / sellingPrice) * 100)
      : 0;

  // JSON-LD Structured Data Schema for Search Engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images?.map((i) => i.image_url) || [],
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: STORE_INFO.name,
    },
    sku: primaryVariant.sku || product.slug,
    offers: {
      '@type': 'Offer',
      url: `${STORE_INFO.siteUrl}/products/${product.slug}`,
      priceCurrency: 'INR',
      price: offerPrice,
      priceValidUntil: '2028-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: STORE_INFO.name,
      },
    },
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-themeBg-canvas pb-24 md:pb-16 min-h-screen">
      {/* Search Engine Rich Snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Global Header Navigation */}
      <Header showBack={true} />

      {/* Responsive Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
        <nav className="flex items-center space-x-2 text-xs text-themeText-secondary">
          <Link href="/" className="hover:text-themeText-primary transition-colors">Home</Link>
          <span>/</span>
          <Link
            href={`/?cat=${encodeURIComponent(product.category?.toLowerCase() || 'all')}`}
            className="hover:text-themeText-primary transition-colors"
          >
            {product.category || 'Catalog'}
          </Link>
          <span>/</span>
          <span className="text-themeText-primary font-semibold truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>
      </div>

      {/* Main Content Layout: Mobile stacked, Desktop side-by-side split */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column (Images Gallery): 7 cols on Desktop */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full h-80 sm:h-[460px] md:h-[520px] rounded-theme-xl overflow-hidden bg-white shadow-sm border border-black/[0.06]">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0].image_url}
                  alt={product.images[0].alt_text || product.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 50vw"
                  className="object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}

              {/* Discount Tag */}
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-theme-sm bg-themeBadge-discount text-white text-xs font-black shadow-md">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Ribbon */}
            {product.images?.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-theme-md overflow-hidden bg-white border-2 border-black/10 flex-shrink-0 cursor-pointer hover:border-themePrimary transition-colors"
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || ''}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (Product Data & Buy Actions): 5 cols on Desktop */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-themeBg-card rounded-theme-xl p-5 sm:p-6 shadow-sm border border-black/[0.06] space-y-4">
              
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-themeText-secondary">
                  {STORE_INFO.name} · {product.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-themeText-primary mt-1 leading-snug">
                  {product.title}
                </h1>
              </div>

              {/* Price Details */}
              <div className="flex items-baseline space-x-3 pt-1">
                <span className="text-2xl sm:text-3xl font-black text-themeText-primary">
                  {STORE_INFO.currency}{offerPrice.toLocaleString()}
                </span>
                {sellingPrice > offerPrice && (
                  <span className="text-sm sm:text-base text-themeText-secondary line-through">
                    {STORE_INFO.currency}{sellingPrice.toLocaleString()}
                  </span>
                )}
                {stock > 0 ? (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    In Stock ({stock} available)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Sizing & Variants */}
              {product.variants?.length > 1 && (
                <div className="pt-2 border-t border-black/[0.06]">
                  <label className="text-xs font-bold text-themeText-primary block mb-2">
                    Select Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="px-3.5 py-1.5 rounded-theme-sm border text-xs font-semibold bg-white border-black/10 hover:border-themePrimary focus:border-themePrimary transition-colors"
                      >
                        {v.size_label || 'Standard'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-3 border-t border-black/[0.06]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary mb-1.5">
                  About This Bag
                </h2>
                <p className="text-xs sm:text-sm text-themeText-secondary leading-relaxed">
                  {product.description ||
                    'Every Leu Tote is individually cut, shaped, and hand-stitched by our artisans using heavyweight canvas and full-grain leather.'}
                </p>
              </div>

              {/* Customer Points Incentive */}
              <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200/80 p-3 rounded-theme-md text-amber-900 text-xs">
                <span className="text-base">🎁</span>
                <span>
                  Earn <strong>{Math.round(offerPrice * 0.05)} Leu Points</strong> on this order to spend on your next purchase!
                </span>
              </div>

              {/* Actions: Proceed to Checkout & Social Share Button */}
              <div className="space-y-2.5 pt-2">
                <Link
                  href={`/checkout?slug=${product.slug}`}
                  className="flex items-center justify-center w-full py-3.5 px-6 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                >
                  Proceed to Buy ({STORE_INFO.currency}{offerPrice.toLocaleString()})
                </Link>

                {/* Social Share Trigger */}
                <ProductShareModal
                  product={product}
                  selectedVariant={primaryVariant}
                />
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Mobile Sticky Navigation */}
      <div className="md:hidden">
        <BottomNav activeTab="home" />
      </div>
    </div>
  );
}