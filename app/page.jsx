// app/page.jsx
import Link from 'next/link';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import ProductGrid from '@/components/ProductGrid';
import SearchFilterForm from '@/components/SearchFilterForm';
import { CATEGORIES } from '@/lib/data';

export default function HomePage({ searchParams }) {
  const query = searchParams?.q?.toLowerCase() || '';
  const categoryFilter = searchParams?.cat || 'all';

  return (
    <div className="flex-1 flex flex-col w-full bg-themeBg-canvas pb-24 md:pb-16 min-h-screen">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Hero Carousel Section */}
      <HeroCarousel />

      {/* 3. Catalog Section with Real API Grid */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 sm:pt-10">
        
        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div className="w-full md:w-80 lg:w-96">
            <SearchFilterForm currentQuery={query} />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => {
              const isActive = categoryFilter === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={cat.id === 'all' ? '/#catalog' : `/?cat=${cat.id}${query ? `&q=${query}` : ''}#catalog`}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 shadow-sm ${
                    isActive
                      ? 'bg-themePrimary text-white shadow-themePrimary/20'
                      : 'bg-white text-themeText-secondary hover:text-themeText-primary border border-black/[0.06] hover:border-black/20'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Active Filter Indicator */}
        {(query || categoryFilter !== 'all') && (
          <div className="mt-4 flex items-center justify-between bg-amber-50/80 border border-amber-200/60 rounded-theme-md px-4 py-2">
            <span className="text-xs font-medium text-amber-900">
              Filtering by: <strong>{categoryFilter !== 'all' ? categoryFilter : ''} {query ? `"${query}"` : ''}</strong>
            </span>
            <Link href="/#catalog" className="text-xs font-bold text-themeAccent hover:underline">
              Reset Filters
            </Link>
          </div>
        )}

        {/* 4. Products Grid Connected to Database API */}
        <section className="pt-6 pb-12">
          <ProductGrid query={query} category={categoryFilter} />
        </section>
      </main>

    </div>
  );
}