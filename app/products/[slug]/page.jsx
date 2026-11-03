// app/products/[slug]/page.jsx
import Image from 'next/image';
import Header from '@/components/Header';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import { PRODUCTS, STORE_INFO } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const product = PRODUCTS.find((p) => p.slug === params.slug);
  if (!product) return {};

  return {
    title: `${product.title} | ${STORE_INFO.name}`,
    description: `${product.description} Offer Price: ₹${product.offer_price}.`,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [{ url: `${STORE_INFO.siteUrl}/products/${product.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
  };
}

export default function ProductDetailPage({ params }) {
  const product = PRODUCTS.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.offer_price,
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main className="flex-1 pb-10 bg-themeBg-canvas">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header title="Product Details" showBack={true} />

      <section className="px-5 pt-2">
        <div className="relative w-full h-80 rounded-theme-xl overflow-hidden bg-white shadow-sm border border-black/5">
          <Image src={product.images[0]} alt={product.title} fill priority className="object-cover" />
        </div>
      </section>

      <section className="px-5 mt-4 space-y-4">
        <div className="bg-white rounded-theme-lg p-5 shadow-sm border border-black/5">
          <span className="text-xs font-semibold uppercase text-themeText-secondary">{product.brand}</span>
          <h1 className="text-xl font-bold text-themeText-primary mt-1">{product.title}</h1>

          <div className="flex items-baseline space-x-3 mt-2">
            <span className="text-2xl font-extrabold text-themeText-primary">₹{product.offer_price.toLocaleString()}</span>
            <span className="text-sm text-themeText-secondary line-through">₹{product.selling_price.toLocaleString()}</span>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              In Stock ({product.stock_quantity})
            </span>
          </div>

          <div className="mt-5 border-t border-black/5 pt-4">
            <h3 className="text-xs font-bold uppercase text-themeText-secondary mb-1">Description</h3>
            <p className="text-xs text-themeText-secondary leading-relaxed">{product.description}</p>
          </div>
        </div>

        <WhatsAppShareButton product={product} />

        <Link
          href={`/checkout?slug=${product.slug}`}
          className="block text-center w-full py-3.5 bg-themePrimary text-white font-semibold text-sm rounded-theme-md"
        >
          Proceed to Buy (₹{product.offer_price})
        </Link>
      </section>
    </main>
  );
}