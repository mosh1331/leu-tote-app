// components/HeroCarousel.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'One at a Time',
    headline: 'Never Mass-Produced. Handcrafted in Person.',
    subtext: 'Every single Leu Tote is cut, shaped, and assembled by our artisans. No robotic conveyor belts—just deliberate, honest craftsmanship.',
    badge: '100% Studio Handcrafted',
    ctaText: 'Explore Collection',
    ctaLink: '/#catalog',
    // Replace with your generated AI artisan workspace image later:
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1600&auto=format&fit=crop&q=80',
    alt: 'Artisan crafting a handmade tote bag in studio'
  },
  {
    id: 2,
    tag: 'Finest Organic Materials',
    headline: 'Heavyweight Canvas & Grained Full Leather.',
    subtext: 'Woven with high-density fibers and paired with supple, natural grain trims that age gracefully and build a rich patina over years of daily wear.',
    badge: 'Custom Organic Duck Fabric',
    ctaText: 'View Tote Bags',
    ctaLink: '/?cat=totes#catalog',
    // Replace with your generated AI fabric & leather texture image:
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1600&auto=format&fit=crop&q=80',
    alt: 'Close-up of premium textured canvas and artisan leather'
  },
  {
    id: 3,
    tag: 'Built to Outlast',
    headline: 'Reinforced Bonded Threads & Precision Zippers.',
    subtext: 'Double-turned hems, bar-tacked stress handles, and custom anti-corrosive solid metal zippers that glide smoothly every time.',
    badge: 'Industrial Grade Stitching',
    ctaText: 'View Bucket Bags',
    ctaLink: '/?cat=buckets#catalog',
    // Replace with your generated AI stitching & zipper detail image:
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1600&auto=format&fit=crop&q=80',
    alt: 'Detailed view of durable brass zippers and heavy-gauge stitching'
  },
  {
    id: 4,
    tag: 'Designed for Daily Poise',
    headline: 'Thoughtful Utility for Everyday Rituals.',
    subtext: 'Spacious compartments, key tethers, and wide ergonomic straps weighted evenly for hands-free comfort from sunrise commutes to weekend getaways.',
    badge: 'Ergonomic & Lightweight',
    ctaText: 'Shop All Designs',
    ctaLink: '/#catalog',
    // Replace with your generated AI lifestyle bag in use image:
    image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1600&auto=format&fit=crop&q=80',
    alt: 'Handmade utility bag worn comfortably on the move'
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-play timer (5 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Touch Swipe Handlers for Mobile Ergonomics
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      // Swiped Left -> Next
      setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    } else if (distance < -50) {
      // Swiped Right -> Prev
      setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-themeText-primary text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Artisan highlights carousel"
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className="w-full flex-shrink-0 relative min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] flex items-center justify-center"
          >
            {/* Background Image with Dark Vignette Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Gradients to keep text readable on both dark & bright imagery */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent hidden sm:block" />
            </div>

            {/* Slide Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full py-16 flex flex-col justify-center items-start">
              <div className="max-w-2xl space-y-3.5 sm:space-y-4">
                
                {/* Badge Tag */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-themeAccent" />
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                    {slide.badge}
                  </span>
                </div>

                {/* Subtitle / Category Tag */}
                <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-themeAccent">
                  {slide.tag}
                </p>

                {/* Headline */}
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
                  {slide.headline}
                </h2>

                {/* Body Prose */}
                <p className="text-xs sm:text-base text-gray-200/90 font-normal leading-relaxed max-w-xl">
                  {slide.subtext}
                </p>

                {/* Call to Action Button */}
                <div className="pt-2 sm:pt-4 flex items-center space-x-4">
                  <Link
                    href={slide.ctaLink}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-theme-md bg-white text-themeText-primary hover:bg-themeBg-canvas hover:scale-[1.02] active:scale-95 text-xs sm:text-sm font-bold shadow-lg transition-all"
                  >
                    <span>{slide.ctaText}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                  <span className="hidden sm:inline-block text-xs font-medium text-white/70">
                    Handmade in India
                  </span>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Desktop Arrow Controls */}
      <button
        type="button"
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
        aria-label="Previous slide"
        className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1))}
        aria-label="Next slide"
        className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators / Bar Dots */}
      <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center items-center space-x-2 px-4">
        {HERO_SLIDES.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => setCurrentSlide(dotIdx)}
            aria-label={`Go to slide ${dotIdx + 1}`}
            className={`h-1.5 transition-all duration-300 rounded-full ${
              currentSlide === dotIdx
                ? 'w-8 bg-white shadow-sm'
                : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}