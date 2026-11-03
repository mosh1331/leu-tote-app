// components/Header.jsx
import Link from 'next/link';
import { STORE_INFO } from '@/lib/data';

export default function Header({ showBack = false }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-black/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Back Button */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {showBack && (
            <Link
              href="/"
              aria-label="Back to home"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-themeBg-surface flex items-center justify-center text-themeText-primary hover:bg-black/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}

          <Link href="/" className="flex flex-col">
            <span className="text-lg sm:text-2xl font-black tracking-tight text-themeText-primary">
              {STORE_INFO.name}
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-themeText-secondary uppercase tracking-widest -mt-0.5">
              Artisan Studio
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links (Hidden on mobile) */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-themeText-secondary">
          <Link href="/" className="text-themeText-primary hover:text-themeAccent transition-colors">
            Catalog
          </Link>
          <Link href="/?cat=totes" className="hover:text-themeText-primary transition-colors">
            Totes
          </Link>
          <Link href="/?cat=buckets" className="hover:text-themeText-primary transition-colors">
            Bucket Bags
          </Link>
          <Link href="/?cat=shoulder" className="hover:text-themeText-primary transition-colors">
            Shoulder Bags
          </Link>
          <Link href="/rewards" className="hover:text-themeText-primary transition-colors">
            Rewards &amp; Referrals
          </Link>
        </nav>

        {/* Right: Actions (Wishlist & Cart CTA) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/rewards"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <span>★</span>
            <span>Rewards</span>
          </Link>

          <Link
            href="/checkout"
            aria-label="View shopping cart"
            className="flex items-center space-x-2 h-10 px-3.5 sm:px-4 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">Bag / Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}