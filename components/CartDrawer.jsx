// components/CartDrawer.jsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { STORE_INFO } from '@/lib/data';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, updateQuantity, removeFromCart, cartSubtotal, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-themeBg-canvas w-full max-w-md h-full flex flex-col shadow-2xl border-l border-black/10">
        
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-themeText-primary">Your Shopping Bag</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-themeBg-surface font-semibold text-themeText-secondary">
              {totalItems} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-themeBg-surface flex items-center justify-center text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <span className="text-4xl">👜</span>
              <p className="text-sm font-bold text-themeText-primary">Your bag is empty</p>
              <p className="text-xs text-themeText-secondary">Add some handcrafted goods to start shopping.</p>
              <button
                onClick={onClose}
                className="mt-3 px-5 py-2 rounded-theme-md bg-themePrimary text-white text-xs font-semibold"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variantId}
                className="bg-white rounded-theme-lg p-3.5 border border-black/[0.06] flex space-x-3.5 items-center"
              >
                <div className="relative w-16 h-16 rounded-theme-md overflow-hidden bg-themeBg-surface flex-shrink-0">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-themeText-primary truncate">{item.title}</h3>
                  <p className="text-[10px] text-themeText-secondary">
                    Size: {item.size} {item.color ? `· ${item.color}` : ''}
                  </p>
                  <p className="text-xs font-black text-themeText-primary mt-1">
                    {STORE_INFO.currency}{item.unitPrice.toLocaleString()}
                  </p>
                </div>

                {/* Counter controls */}
                <div className="flex items-center space-x-1 border rounded-lg bg-gray-50 px-1 py-0.5">
                  <button
                    onClick={() => updateQuantity(item.variantId, -1)}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variantId, 1)}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.variantId)}
                  className="text-gray-400 hover:text-red-500 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout button */}
        {cart.length > 0 && (
          <div className="p-5 bg-white border-t border-black/[0.06] space-y-3">
            <div className="flex justify-between text-xs text-themeText-secondary">
              <span>Subtotal</span>
              <span className="font-bold text-themeText-primary">
                {STORE_INFO.currency}{cartSubtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-themeText-secondary">
              <span>Shipping across India</span>
              <span className="text-green-600 font-bold">FREE</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-black text-themeText-primary">
              <span>Total Payable</span>
              <span>{STORE_INFO.currency}{cartSubtotal.toLocaleString()}</span>
            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              className="block text-center w-full py-3.5 bg-themePrimary hover:bg-themePrimary-hover text-white rounded-theme-md text-sm font-bold shadow-md transition-all active:scale-[0.98]"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}