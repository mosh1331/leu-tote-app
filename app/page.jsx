// app/page.jsx
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import CatalogSection from '@/components/CatalogSection';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col w-full bg-themeBg-canvas pb-24 md:pb-16 min-h-screen">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Hero Carousel Section */}
      <HeroCarousel />

      {/* 3. Catalog Section with Local State Filtering */}
      <CatalogSection />
    </div>
  );
}