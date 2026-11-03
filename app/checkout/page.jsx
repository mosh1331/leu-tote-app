// app/checkout/page.jsx
import Header from '@/components/Header';
// import CheckoutForm from '@/components/CheckoutForm';
import { PRODUCTS } from '@/lib/data';

export default function CheckoutPage({ searchParams }) {
  const slug = searchParams?.slug || PRODUCTS[0].slug;
  const product = PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0];

  return (
    <main className="flex-1 pb-12 bg-themeBg-canvas">
      <Header title="Secure Checkout" showBack={true} />
      <div className="px-5 pt-2">
        {/* <CheckoutForm product={product} /> */}
      </div>
    </main>
  );
}