// components/ProductGallery.jsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images = [], title = 'Product Image', discountPercent = 0 }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Normalize image data (handles both DB objects {image_url} and simple strings)
  const imageList = images.length > 0
    ? images.map((img) => (typeof img === 'string' ? { image_url: img, alt_text: title } : img))
    : [{ image_url: '/placeholder-bag.png', alt_text: title }];

  const activeImage = imageList[selectedIndex] || imageList[0];

  // Handle ESC key to close full-screen modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullScreen(false);
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev + 1) % imageList.length);
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, imageList.length]);

  return (
    <div className="w-full space-y-3.5 select-none">
      {/* 1. Main Selected Image (Tap to open full-screen) */}
      <div
        onClick={() => setIsFullScreen(true)}
        className="group relative w-full h-80 sm:h-[460px] md:h-[520px] rounded-theme-xl overflow-hidden bg-white shadow-sm border border-black/[0.06] cursor-zoom-in transition-all duration-300"
      >
        <Image
          src={activeImage.image_url}
          alt={activeImage.alt_text || title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 50vw"
          className="object-contain object-center p-3 sm:p-5 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-theme-sm bg-themeBadge-discount text-white text-xs font-black shadow-md">
            {discountPercent}% OFF
          </div>
        )}

        {/* Subtle Zoom Hint Icon */}
        <div className="absolute bottom-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-black/10 flex items-center justify-center text-themeText-secondary opacity-75 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>
      </div>

      {/* 2. Horizontally Scrollable Thumbnail Bar */}
      {imageList.length > 1 && (
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1 px-0.5">
          {imageList.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`View photo ${idx + 1}`}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-theme-lg overflow-hidden bg-white flex-shrink-0 transition-all duration-300 active:scale-95 border-2 ${
                  isSelected
                    ? 'border-themePrimary ring-2 ring-themePrimary/20 shadow-sm'
                    : 'border-black/[0.06] opacity-70 hover:opacity-100 hover:border-black/20'
                }`}
              >
                <Image
                  src={img.image_url}
                  alt={img.alt_text || `Thumbnail ${idx + 1}`}
                  fill
                  sizes="100px"
                  className="object-contain p-1.5 transition-transform duration-300"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Full-Screen Lightbox View */}
      {isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-fade-in"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between z-20 text-white w-full max-w-7xl mx-auto">
            <span className="text-xs sm:text-sm font-semibold tracking-wider text-white/70">
              {selectedIndex + 1} / {imageList.length} — {title}
            </span>

            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
              aria-label="Close full-screen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Center Stage Image */}
          <div className="relative flex-1 w-full max-w-5xl mx-auto my-4 flex items-center justify-center">
            <Image
              src={activeImage.image_url}
              alt={activeImage.alt_text || title}
              fill
              sizes="100vw"
              className="object-contain transition-all duration-300"
              priority
            />

            {/* Prev / Next Buttons */}
            {imageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
                  }}
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev + 1) % imageList.length);
                  }}
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {imageList.length > 1 && (
            <div className="flex items-center justify-center space-x-2 overflow-x-auto no-scrollbar py-2 z-20">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative w-14 h-14 rounded-theme-md overflow-hidden bg-white/10 flex-shrink-0 transition-all ${
                    selectedIndex === idx ? 'ring-2 ring-white scale-105' : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}