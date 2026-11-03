// components/ProductCard.jsx
import Image from 'next/image';
import Link from 'next/link';
import { STORE_INFO } from '@/lib/data';

export default function ProductCard({ product }) {
  // Extract primary image (supports string URL array or object array from PostgreSQL API)
  const imageUrl =
    typeof product.images?.[0] === 'string'
      ? product.images[0]
      : product.images?.[0]?.image_url || '/placeholder-bag.png';

  // Extract pricing from variants array (PostgreSQL API) or top-level fields
  const primaryVariant = product.variants?.[0] || {};
  const offerPrice = Number(product.offer_price ?? primaryVariant.offer_price ?? 0);
  const sellingPrice = Number(product.selling_price ?? primaryVariant.selling_price ?? offerPrice);

  const discountPercent =
    sellingPrice > offerPrice
      ? Math.round(((sellingPrice - offerPrice) / sellingPrice) * 100)
      : 0;

  return (
    <div className="bg-themeBg-card rounded-theme-lg p-3 sm:p-4 shadow-sm border border-black/[0.06] hover:shadow-lg hover:border-black/10 transition-all duration-300 flex flex-col justify-between relative group">
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <span className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-theme-sm bg-themeBadge-discount text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
          -{discountPercent}%
        </span>
      )}

      {/* Bag Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative w-full h-44 sm:h-60 md:h-64 lg:h-72 rounded-theme-md overflow-hidden bg-themeBg-surface mb-3.5"
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-themeText-secondary">
            {product.category || STORE_INFO.name}
          </span>
          <Link href={`/products/${product.slug}`}>
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-themeText-primary line-clamp-1 hover:text-themeAccent transition-colors mt-0.5">
              {product.title}
            </h2>
          </Link>
        </div>

        <div className="mt-2.5">
          {/* Price Row */}
          <div className="flex items-baseline space-x-2">
            <span className="text-sm sm:text-base md:text-lg font-extrabold text-themeText-primary">
              {STORE_INFO.currency}{offerPrice.toLocaleString()}
            </span>
            {sellingPrice > offerPrice && (
              <span className="text-xs sm:text-sm text-themeText-secondary line-through">
                {STORE_INFO.currency}{sellingPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Color Labels / Badges if present */}
          {primaryVariant.color_label && (
            <div className="mt-2 text-[10px] text-themeText-secondary font-medium">
              Color: {primaryVariant.color_label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}