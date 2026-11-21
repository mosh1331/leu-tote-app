// app/page.jsx
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import CatalogSection from '@/components/CatalogSection';
import OfferPopupModal from '@/components/OfferPopupModal';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col w-full bg-themeBg-canvas pb-24 md:pb-16 min-h-screen">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Hero Carousel Section */}
      <HeroCarousel />

      {/* 3. Catalog Section with Local State Filtering */}
      <CatalogSection />
      <OfferPopupModal
        storageKey="leu_tote_festive_2026"
        badgeText="Limited Festive Drop"
        headline="Flat ₹69 Kerala & ₹99 India Shipping"
        offers={[
          { region: 'All Kerala', price: '₹69', tag: 'Express', highlight: true },
          { region: 'All India', price: '₹99', tag: 'Pan-India', highlight: false },
        ]}
        ctaText="Shop Festive Collection"
      />
    </div>
  );
}