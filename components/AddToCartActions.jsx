// components/AddToCartActions.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { STORE_INFO } from '@/lib/data';

export default function AddToCartActions({ product, selectedVariant }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const stock = Number(selectedVariant?.stock_quantity ?? 0);
  const isAvailable = stock > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, selectedVariant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isAvailable) return;
    addToCart(product, selectedVariant, 1);
    router.push('/checkout');
  };

  return (
    <div className="space-y-2.5 pt-2">
      <div className="grid grid-cols-2 gap-3">
        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className="w-full py-3.5 px-4 rounded-theme-md bg-white border-2 border-themePrimary text-themePrimary hover:bg-black/5 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>

        {/* Instant Buy Now Button */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!isAvailable}
          className="w-full py-3.5 px-4 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          Buy Now (₹{Number(selectedVariant?.offer_price || 0).toLocaleString()})
        </button>
      </div>
    </div>
  );
}