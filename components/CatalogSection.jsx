// components/CatalogSection.jsx
'use client';

import { useState, useRef } from 'react';
import ProductGrid from '@/components/ProductGrid';
import { CATEGORIES } from '@/lib/data';

export default function CatalogSection() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const catalogTopRef = useRef(null);

  const hasActiveFilter = selectedCategory !== 'all' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const scrollToCatalogTop = () => {
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main
      id="catalog"
      ref={catalogTopRef}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 sm:pt-10"
    >
      {/* 1. Sticky Mobile & Desktop Filter Bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 pt-3 pb-3 sm:py-4 bg-themeBg-canvas/95 backdrop-blur-md border-b border-black/[0.06] transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          
          {/* Instant Search Input (text-base on mobile prevents browser zoom) */}
          <div className="w-full md:w-80 lg:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-themeText-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search totes, buckets, bags..."
              className="w-full pl-10 pr-9 py-2.5 bg-white rounded-theme-md text-base sm:text-sm font-medium text-themeText-primary placeholder-themeText-muted border border-black/[0.08] shadow-sm focus:outline-none focus:ring-2 focus:ring-themePrimary/20 focus:border-themePrimary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-black text-xs font-bold"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Horizontal Scrollable Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 shadow-sm ${
                    isActive
                      ? 'bg-themePrimary text-white shadow-themePrimary/20'
                      : 'bg-white text-themeText-secondary hover:text-themeText-primary border border-black/[0.06] hover:border-black/20'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Active Filter Indicator */}
      {hasActiveFilter && (
        <div className="mt-4 flex items-center justify-between bg-amber-50/90 border border-amber-200/60 rounded-theme-md px-4 py-2.5">
          <span className="text-xs font-medium text-amber-900">
            Showing:{' '}
            <strong>
              {selectedCategory !== 'all' ? selectedCategory : ''}
              {selectedCategory !== 'all' && searchQuery ? ' · ' : ''}
              {searchQuery ? `"${searchQuery}"` : ''}
            </strong>
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-themeAccent hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 3. Paginated Product Grid (20 items per page) */}
      <section className="pt-5 pb-14">
        <ProductGrid
          query={searchQuery}
          category={selectedCategory}
          itemsPerPage={20}
          onPageChange={scrollToCatalogTop}
        />
      </section>
    </main>
  );
}