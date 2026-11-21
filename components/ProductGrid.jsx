// components/ProductGrid.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductGrid({
  query = '',
  category = 'all',
  itemsPerPage = 20,
  onPageChange,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch active catalog products
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setProducts(data.products || []);
        }
      })
      .catch((err) => console.error('Failed to load catalog:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, category]);

  // Filter products by category & search query
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = category.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        cat === 'all' || (product.category || '').toLowerCase() === cat;

      const matchesSearch =
        !q ||
        (product.title || '').toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q) ||
        (product.category || '').toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, query, category]);

  // Pagination math
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, safePage, itemsPerPage]);

  const handlePageSelect = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === safePage) return;
    setCurrentPage(newPage);
    if (onPageChange) onPageChange();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/70 rounded-theme-xl h-72 sm:h-80 animate-pulse border border-black/[0.04]"
          />
        ))}
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="bg-white rounded-theme-xl p-10 text-center border border-black/5 space-y-2">
        <p className="text-sm font-bold text-themeText-primary">No bags found</p>
        <p className="text-xs text-themeText-secondary">
          Try clearing your search or switching to another category.
        </p>
      </div>
    );
  }

  const startItemNumber = (safePage - 1) * itemsPerPage + 1;
  const endItemNumber = Math.min(safePage * itemsPerPage, totalItems);

  return (
    <div className="space-y-8">
      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-themeText-secondary">
        <span>
          Showing <strong>{startItemNumber}–{endItemNumber}</strong> of{' '}
          <strong>{totalItems}</strong> handcrafted bags
        </span>
        {totalPages > 1 && (
          <span className="font-semibold">
            Page {safePage} of {totalPages}
          </span>
        )}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {paginatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination Controls (Visible when > 20 items) */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-themeText-secondary">
            Viewing {startItemNumber} to {endItemNumber} of {totalItems} items
          </p>

          <div className="flex items-center space-x-1.5">
            {/* Previous Button */}
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => handlePageSelect(safePage - 1)}
              className="px-3.5 py-2 rounded-theme-md bg-white border border-black/10 text-xs font-bold text-themeText-primary hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all"
            >
              ← Prev
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                // Condense page numbers if there are many pages
                if (
                  totalPages > 5 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - safePage) > 1
                ) {
                  if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                    return (
                      <span key={pageNum} className="px-1.5 text-xs text-themeText-secondary">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                const isCurrent = pageNum === safePage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageSelect(pageNum)}
                    className={`w-9 h-9 rounded-theme-md text-xs font-extrabold transition-all active:scale-95 ${
                      isCurrent
                        ? 'bg-themePrimary text-white shadow-sm'
                        : 'bg-white text-themeText-primary border border-black/10 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => handlePageSelect(safePage + 1)}
              className="px-3.5 py-2 rounded-theme-md bg-white border border-black/10 text-xs font-bold text-themeText-primary hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}