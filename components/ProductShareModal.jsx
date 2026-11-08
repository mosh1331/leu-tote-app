// components/ProductShareModal.jsx
'use client';

import { useState } from 'react';
import { STORE_INFO } from '@/lib/data';

const INSTAGRAM_URL = 'https://www.instagram.com/leu.tote/';

export default function ProductShareModal({ product, selectedVariant }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const offerPrice = Number(selectedVariant?.offer_price || product.offer_price || 0);
  const sellingPrice = Number(selectedVariant?.selling_price || product.selling_price || offerPrice);
  const discountPercent =
    sellingPrice > offerPrice
      ? Math.round(((sellingPrice - offerPrice) / sellingPrice) * 100)
      : 0;

  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/products/${product.slug}`
      : `${STORE_INFO.siteUrl}/products/${product.slug}`;

  // Structured Social & WhatsApp Share Message
  const shareMessage =
    `✨ *${product.title}* by ${STORE_INFO.name}\n\n` +
    `🏷️ *Special Price:* ₹${offerPrice.toLocaleString()}` +
    (discountPercent > 0 ? ` (~₹${sellingPrice.toLocaleString()}~, *${discountPercent}% OFF*)` : '') +
    `\n🚚 *Shipping:* All Kerala @ ₹69 only | All India @ ₹99\n` +
    `🧵 100% Studio Handcrafted Quality\n\n` +
    `Tap to view bag & order directly:\n${currentUrl}\n\n` +
    `Follow us on Instagram: ${INSTAGRAM_URL}`;

  // Native Web Share API trigger
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.title} | ${STORE_INFO.name}`,
          text: shareMessage,
          url: currentUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
    }
  };

  return (
    <>
      {/* Primary Trigger Button */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-theme-md bg-themeBg-surface hover:bg-black/5 text-themeText-primary border border-black/[0.08] text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        aria-label="Share product"
      >
        <svg className="w-4 h-4 text-themeText-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share Bag &amp; Offers</span>
      </button>

      {/* Share Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-themeBg-card w-full max-w-sm rounded-theme-xl p-5 shadow-2xl border border-black/10 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-themeText-primary">Share Handcrafted Bag</h3>
                <p className="text-[10px] text-themeText-secondary">Send details, shipping rates &amp; direct links</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-themeBg-surface flex items-center justify-center text-gray-500 hover:text-black active:scale-95 transition-all"
                aria-label="Close share modal"
              >
                ✕
              </button>
            </div>

            {/* Product Share Summary Card */}
            <div className="p-3 bg-themeBg-surface rounded-theme-md border border-black/[0.04] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-themeText-primary truncate">{product.title}</h4>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-sm font-black text-themeText-primary">
                      ₹{offerPrice.toLocaleString()}
                    </span>
                    {sellingPrice > offerPrice && (
                      <span className="text-[11px] text-themeText-secondary line-through">
                        ₹{sellingPrice.toLocaleString()}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Highlight Pill */}
              <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center space-x-1">
                <span>🚚</span>
                <span>Kerala @ ₹69 | All India @ ₹99</span>
              </div>
            </div>

            {/* Sharing Options */}
            <div className="space-y-2">
              {/* WhatsApp One-Click Share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold rounded-theme-md transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.126-.532-1.83-.758-2.923-1.843-3.042-2.001-.118-.159-.971-1.292-.971-2.464 0-1.173.614-1.749.832-1.986.219-.238.477-.298.636-.298.159 0 .318.002.457.009.146.007.342-.056.536.41.199.477.677 1.652.736 1.772.06.12.099.26.02.419-.079.159-.119.258-.238.397-.12.14-.251.312-.358.419-.12.119-.245.249-.105.489.14.239.624 1.028 1.339 1.664.919.818 1.694 1.072 1.933 1.191.239.12.378.1.518-.06.139-.159.596-.694.755-.933.159-.239.318-.199.536-.119.219.079 1.391.656 1.63.775.239.12.398.179.457.279.06.099.06.577-.084.982z" />
                </svg>
                <span>Share via WhatsApp</span>
              </a>

              {/* Instagram Profile Link */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white text-xs font-bold rounded-theme-md transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Visit Us on Instagram (@leu.tote)</span>
              </a>

              {/* Copy Direct Storefront Link */}
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-themeBg-surface hover:bg-gray-200 text-themeText-primary text-xs font-semibold rounded-theme-md transition-colors border border-black/[0.06] active:scale-[0.98]"
              >
                <span>{copied ? '✓ Link Copied to Clipboard!' : 'Copy Direct Link'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}