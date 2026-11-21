// components/OfferPopupModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { STORE_INFO } from '@/lib/data';

export default function OfferPopupModal({
  storageKey = 'leu_tote_shipping_offer_seen',
  delayMs = 900,
  badgeText = 'Special Studio Offer',
  headline = 'Flat-Rate Delivery Across India',
  subtext = 'Handcrafted slow-fashion totes delivered straight from our Kerala studio to your doorstep.',
  offers = [
    {
      region: 'All Kerala Delivery',
      price: '₹69',
      tag: 'Flat Rate',
      highlight: true,
    },
    {
      region: 'Rest of India Delivery',
      price: '₹99',
      tag: 'Flat Rate',
      highlight: false,
    },
  ],
  ctaText = 'Explore Handcrafted Bags',
  onCtaClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show only once per browser session on first page load
    // const hasSeen = sessionStorage.getItem(storageKey);
    const hasSeen = false
    if (hasSeen) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(storageKey, 'true');
    }, delayMs);

    return () => clearTimeout(timer);
  }, [storageKey, delayMs]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleAction = () => {
    handleClose();
    if (onCtaClick) {
      onCtaClick();
    } else {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      onClick={handleClose}
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md bg-themeBg-card rounded-theme-xl border border-black/10 shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Decorative Studio Top Banner */}
        <div className="relative bg-themePrimary text-white px-6 pt-7 pb-6 text-center overflow-hidden">
          {/* Subtle Ambient Glow / Geometric Ornaments */}
          <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-12 -right-8 w-36 h-36 rounded-full bg-amber-300/15 blur-xl animate-pulse" />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close offer popup"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs font-bold transition-all active:scale-90"
          >
            ✕
          </button>

          {/* Animated Offer Pill */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-extrabold uppercase tracking-widest mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            <span>{badgeText}</span>
          </div>

          <h2
            id="offer-modal-title"
            className="text-xl sm:text-2xl font-black tracking-tight leading-snug"
          >
            {headline}
          </h2>
          <p className="text-xs text-white/80 mt-1.5 max-w-xs mx-auto leading-relaxed">
            {subtext}
          </p>
        </div>

        {/* Body: Shipping Rate Cards */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {offers.map((item, idx) => (
              <div
                key={idx}
                className={`relative p-3.5 rounded-theme-lg border text-center transition-transform duration-200 hover:-translate-y-0.5 ${
                  item.highlight
                    ? 'bg-emerald-50/80 border-emerald-200 shadow-sm'
                    : 'bg-themeBg-surface border-black/[0.06]'
                }`}
              >
                {item.tag && (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-1.5 ${
                      item.highlight
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-themeText-secondary border border-black/10'
                    }`}
                  >
                    {item.tag}
                  </span>
                )}

                <div className="text-2xl sm:text-3xl font-black text-themeText-primary font-mono tracking-tight">
                  {item.price}
                  <span className="text-xs font-bold text-themeText-secondary ml-0.5">
                    only
                  </span>
                </div>

                <p className="text-[11px] font-bold text-themeText-primary mt-1">
                  {item.region}
                </p>
              </div>
            ))}
          </div>

          {/* Bonus Studio Perk Strip */}
          <div className="flex items-center justify-center space-x-2 py-2 px-3 rounded-theme-md bg-amber-50/90 border border-amber-200/70 text-[11px] font-semibold text-amber-950">
            <span>🎁</span>
            <span>Plus earn 5% back in Leu Points on every order!</span>
          </div>

          {/* Primary CTA & Dismiss */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleAction}
              className="w-full py-3 px-5 bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold rounded-theme-md shadow-md transition-all active:scale-[0.98]"
            >
              {ctaText}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-1.5 text-[11px] font-semibold text-themeText-secondary hover:text-themeText-primary transition-colors"
            >
              Continue browsing {STORE_INFO.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}