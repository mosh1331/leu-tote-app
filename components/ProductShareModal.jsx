// components/ProductShareModal.jsx
'use client';

import { useState } from 'react';
import { STORE_INFO } from '@/lib/data';

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

  // Pre-formatted text payload for social messaging
  const shareMessage =
    `✨ *${product.title}* by ${STORE_INFO.name}\n` +
    `🏷️ *Offer Price:* ₹${offerPrice.toLocaleString()}` +
    (discountPercent > 0 ? ` (~₹${sellingPrice.toLocaleString()}~, *${discountPercent}% OFF*)` : '') +
    `\n🧵 100% Studio Handcrafted Quality\n\n` +
    `Tap to view bag & order directly:\n${currentUrl}`;

  // Native Web Share API trigger
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
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
      {/* Primary Share CTA Button styled with theme variables */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-theme-md bg-themeBg-surface hover:bg-black/5 text-themeText-primary border border-black/[0.08] text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        aria-label="Share product"
      >
        <svg className="w-4 h-4 text-themeText-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share Offer &amp; Details</span>
      </button>

      {/* Share Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-themeBg-card w-full max-w-sm rounded-theme-xl p-5 shadow-2xl border border-black/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <h3 className="text-sm font-bold text-themeText-primary">Share This Bag</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-themeBg-surface flex items-center justify-center text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Product Share Summary Card */}
            <div className="flex items-center space-x-3 p-3 bg-themeBg-surface rounded-theme-md border border-black/[0.04]">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-themeText-primary truncate">{product.title}</h4>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-xs font-extrabold text-themeText-primary">₹{offerPrice}</span>
                  {sellingPrice > offerPrice && (
                    <span className="text-[10px] text-themeText-secondary line-through">₹{sellingPrice}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
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
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold rounded-theme-md transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.126-.532-1.83-.758-2.923-1.843-3.042-2.001-.118-.159-.971-1.292-.971-2.464 0-1.173.614-1.749.832-1.986.219-.238.477-.298.636-.298.159 0 .318.002.457.009.146.007.342-.056.536.41.199.477.677 1.652.736 1.772.06.12.099.26.02.419-.079.159-.119.258-.238.397-.12.14-.251.312-.358.419-.12.119-.245.249-.105.489.14.239.624 1.028 1.339 1.664.919.818 1.694 1.072 1.933 1.191.239.12.378.1.518-.06.139-.159.596-.694.755-.933.159-.239.318-.199.536-.119.219.079 1.391.656 1.63.775.239.12.398.179.457.279.06.099.06.577-.084.982z" />
                </svg>
                <span>Share to WhatsApp</span>
              </a>

              {/* Copy Direct Link */}
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-themeBg-surface hover:bg-gray-200 text-themeText-primary text-xs font-semibold rounded-theme-md transition-colors border border-black/[0.06]"
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