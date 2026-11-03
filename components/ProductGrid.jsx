// components/ProductGrid.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function ProductGrid({ query = '', category = 'all' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category && category !== 'all') params.set('cat', category);

    fetch(`/api/products?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load bags catalog.');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setProducts(data.products || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Something went wrong');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query, category]);

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white rounded-theme-lg p-3 sm:p-4 border border-black/[0.06] space-y-3">
            <div className="w-full h-44 sm:h-56 md:h-64 bg-gray-200 rounded-theme-md" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-theme-lg p-8 text-center text-red-700 max-w-md mx-auto my-6">
        <p className="text-sm font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs font-bold underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty Search / Filter State
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-theme-lg p-12 text-center border border-black/[0.06] shadow-sm max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-themeBg-surface flex items-center justify-center mx-auto mb-3 text-themeText-muted">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-themeText-primary">No bags found</h3>
        <p className="text-xs text-themeText-secondary mt-1">
          We couldn’t find any products matching your criteria.
        </p>
        <Link
          href="/#catalog"
          className="inline-block mt-4 px-5 py-2.5 bg-themePrimary text-white rounded-theme-md text-xs font-semibold active:scale-95 transition-transform"
        >
          Clear All Filters
        </Link>
      </div>
    );
  }

  // 4. Live Multi-Device Adaptive Product Grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}