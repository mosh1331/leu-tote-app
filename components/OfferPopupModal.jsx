// components/OfferPopupModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { STORE_INFO } from '@/lib/data';

export default function OfferPopupModal({
  storageKey = 'leu_tote_shipping_offer_seen',
  delayMs = 900,
  topTagText = 'LAUNCH OFFER',
  mainTitle = 'SHIPPING',
  subTitle = 'BONANZA',
  ribbonText = 'FLAT RATE ACROSS INDIA',
  subtext = '',
  offers = [
    {
      region: 'All Kerala Delivery',
      price: '₹69',
      tag: 'Express Flat Rate',
      highlight: true,
    },
    {
      region: 'All India Delivery',
      price: '₹99',
      tag: 'All-India Rate',
      highlight: false,
    },
  ],
  ctaText = 'Shop Now',
  onCtaClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem(storageKey);
    // const hasSeen = false
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      onClick={handleClose}
    >
      {/* Main Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md bg-themeBg-card rounded-theme-xl border border-black/10 shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* ============================================================ */}
        {/* HERO GRAPHIC STAGE (Starburst Rays + Layered 3D Origami Card) */}
        {/* ============================================================ */}
        <div className="relative bg-gradient-to-b from-[#23192D] via-[#2C2238] to-[#1A202C] pt-10 pb-8 px-6 text-center overflow-hidden select-none">
          
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close offer popup"
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs font-bold transition-all active:scale-90"
          >
            ✕
          </button>

          {/* Radiating Gold Starburst Rays (SVG) */}
          <svg
            viewBox="0 0 400 280"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-90 animate-pulse"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="goldRay" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Burst Beams */}
            <g stroke="url(#goldRay)" strokeLinecap="round">
              <line x1="200" y1="140" x2="75" y2="12" strokeWidth="3.5" />
              <line x1="200" y1="140" x2="140" y2="8" strokeWidth="2" />
              <line x1="200" y1="140" x2="265" y2="10" strokeWidth="3" />
              <line x1="200" y1="140" x2="325" y2="28" strokeWidth="2.5" />
              <line x1="200" y1="140" x2="375" y2="75" strokeWidth="3" />
              <line x1="200" y1="140" x2="388" y2="135" strokeWidth="2" />
              <line x1="200" y1="140" x2="372" y2="195" strokeWidth="3" />
              <line x1="200" y1="140" x2="320" y2="255" strokeWidth="2.5" />
              <line x1="200" y1="140" x2="80" y2="252" strokeWidth="3" />
              <line x1="200" y1="140" x2="25" y2="195" strokeWidth="2.5" />
              <line x1="200" y1="140" x2="12" y2="132" strokeWidth="3" />
              <line x1="200" y1="140" x2="28" y2="72" strokeWidth="2" />
            </g>

            {/* Floating Bokeh Accent Rings */}
            <circle cx="118" cy="46" r="11" fill="none" stroke="#FB7185" strokeWidth="1.5" opacity="0.45" />
            <circle cx="292" cy="52" r="7" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.5" />
            <circle cx="88" cy="218" r="8" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.4" />
            <circle cx="305" cy="222" r="12" fill="none" stroke="#FB7185" strokeWidth="1.5" opacity="0.45" />
          </svg>

          {/* Layered Geometric Graphic Stack */}
          <div className="relative z-10 max-w-[270px] mx-auto pt-2">
            
            {/* Tilted Yellow Top Tag ("LIMITED STUDIO OFFER") */}
            <div className="relative z-20 -mb-2.5 mx-auto w-fit transform -rotate-3 bg-gradient-to-r from-[#FDE047] to-[#FACC15] text-[#1E1B4B] px-3.5 py-1 rounded-sm shadow-md border border-yellow-200">
              <span className="text-[10px] font-black tracking-widest uppercase block">
                {topTagText}
              </span>
            </div>

            {/* Tilted Background Accent Planes */}
            <div
              aria-hidden="true"
              className="absolute inset-x-2 top-5 bottom-1 bg-[#1D4ED8] rounded-md transform rotate-3 shadow-lg"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-3 top-6 -bottom-1 bg-[#F97316] rounded-md transform -rotate-3 shadow-md"
            />

            {/* Main Vibrant Blue Origami Card */}
            <div className="relative z-10 bg-gradient-to-br from-[#38BDF8] via-[#0284C7] to-[#0369A1] rounded-md pt-5 pb-7 px-4 shadow-xl border-t border-white/30">
              {/* Top-Right Folded Paper Corner */}
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 w-7 h-7 bg-gradient-to-bl from-[#23192D] via-[#7DD3FC] to-[#BAE6FD] rounded-bl-md shadow-sm"
              />

              <h2
                id="offer-modal-title"
                className="text-3xl sm:text-4xl font-black tracking-tight text-[#FEF08A] drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)] leading-none"
              >
                {mainTitle}
              </h2>
              <div className="text-2xl sm:text-3xl font-black tracking-wide text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] mt-1 leading-none">
                {subTitle}
              </div>
            </div>

            {/* Wrap-Around Gold Ribbon Banner ("FLAT RATE ACROSS INDIA") */}
            <div className="relative z-20 -mt-4 -mx-3">
              {/* Left & Right 3D Ribbon Fold Tabs */}
              <div
                aria-hidden="true"
                className="absolute -bottom-1.5 left-1 w-3 h-3 bg-[#B45309] transform skew-y-[28deg]"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-1.5 right-1 w-3 h-3 bg-[#B45309] transform -skew-y-[28deg]"
              />

              <div className="relative bg-gradient-to-r from-[#FACC15] via-[#FEF08A] to-[#F59E0B] text-[#1E1B4B] py-2 px-4 rounded-sm shadow-lg border-y border-yellow-100">
                <span className="text-xs sm:text-sm font-black tracking-wider uppercase block">
                  {ribbonText}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* BODY: SHIPPING RATE CARDS & STUDIO PERKS                     */}
        {/* ============================================================ */}
        <div className="p-5 sm:p-6 space-y-4 bg-themeBg-card">
          <p className="text-xs text-center text-themeText-secondary leading-relaxed">
            {subtext}
          </p>

          {/* Price Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {offers.map((item, idx) => (
              <div
                key={idx}
                className={`relative p-3.5 rounded-theme-lg border text-center transition-transform duration-200 hover:-translate-y-0.5 ${
                  item.highlight
                    ? 'bg-emerald-50/90 border-emerald-300 shadow-sm'
                    : 'bg-themeBg-surface border-black/[0.08]'
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

          {/* Reward Points Strip */}
          <div className="flex items-center justify-center space-x-2 py-2 px-3 rounded-theme-md bg-amber-50/90 border border-amber-200/80 text-[11px] font-semibold text-amber-950">
            <span>🎁</span>
            <span>Plus earn 5% back in Leu Points on every bag!</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}