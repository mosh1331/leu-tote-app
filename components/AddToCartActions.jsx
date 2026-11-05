// components/AddToCartActions.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function AddToCartActions({ product, selectedVariant }) {
  const router = useRouter();
  const { cart, addToCart, updateQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const stock = Number(selectedVariant?.stock_quantity ?? 0);
  const isAvailable = stock > 0;
  const variantId = selectedVariant?.id;

  // Find this specific item in the active cart
  const cartItem = cart.find(
    (item) => item.variantId === variantId || item.productId === product.id
  );
  const currentQty = cartItem?.quantity || 0;

  // 1. Initial Add to Cart
  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, selectedVariant, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  // 2. Increase quantity (capped at real available stock)
  const handleIncrease = () => {
    if (currentQty >= stock) return;
    updateQuantity(cartItem.variantId, 1);
  };

  // 3. Decrease quantity
  const handleDecrease = () => {
    if (currentQty <= 0) return;
    updateQuantity(cartItem.variantId, -1);
  };

  // 4. Instant Buy Now flow
  const handleBuyNow = () => {
    if (!isAvailable) return;
    if (currentQty === 0) {
      addToCart(product, selectedVariant, 1);
    }
    router.push('/checkout');
  };

  return (
    <div className="space-y-2.5 pt-2">
      <div className="grid grid-cols-2 gap-3">
        {/* LEFT COLUMN: Add to Cart OR Interactive Quantity Stepper */}
        {currentQty > 0 ? (
          <div className="w-full h-[46px] rounded-theme-md bg-white border-2 border-themePrimary flex items-center justify-between px-2 sm:px-3 shadow-sm">
            {/* Decrement Button */}
            <button
              type="button"
              onClick={handleDecrease}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-themeText-primary hover:bg-black/5 active:scale-95 transition-all"
              aria-label="Decrease quantity"
            >
              −
            </button>

            {/* Current Qty Display */}
            <div className="flex flex-col items-center leading-none">
              <span className="text-xs sm:text-sm font-black text-themeText-primary">
                {currentQty} in Bag
              </span>
              {currentQty >= stock && (
                <span className="text-[9px] font-bold text-amber-600 mt-0.5">
                  Max stock
                </span>
              )}
            </div>

            {/* Increment Button (Disabled if reaching max stock) */}
            <button
              type="button"
              onClick={handleIncrease}
              disabled={currentQty >= stock}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-themeText-primary hover:bg-black/5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Increase quantity"
              title={currentQty >= stock ? 'Reached available stock' : 'Add one more'}
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="w-full h-[46px] px-4 rounded-theme-md bg-white border-2 border-themePrimary text-themePrimary hover:bg-black/5 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {justAdded ? '✓ Added' : 'Add to Cart'}
          </button>
        )}

        {/* RIGHT COLUMN: Instant Checkout Button */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!isAvailable}
          className="w-full h-[46px] px-4 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          Buy Now (₹
          {Number(
            (selectedVariant?.offer_price || 0) * (currentQty || 1)
          ).toLocaleString()}
          )
        </button>
      </div>

      {/* Helper text showing stock ceiling when near limit */}
      {isAvailable && stock > 0 && stock <= 5 && (
        <p className="text-[11px] text-amber-700 font-semibold text-center">
          ⚡ Only {stock} left in stock!
        </p>
      )}
    </div>
  );
}