// app/layout.jsx
import { CartProvider } from '@/context/CartContext';
import './globals.css';
import { STORE_INFO } from '@/lib/data';

export const metadata = {
  metadataBase: new URL(STORE_INFO.siteUrl),
  title: {
    default: `${STORE_INFO.name} | Handcrafted Bags & Utility Totes`,
    template: `%s | ${STORE_INFO.name}`,
  },
   icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  description: STORE_INFO.tagline,
  keywords: ["handmade tote bags", "mother bag", "artisan totes", "leu tote","handmade bags","utility bags"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-themeBg-canvas text-themeText-primary antialiased flex flex-col">
        {/* Full viewport responsive canvas */}
        <CartProvider>
          <div className="flex-1 flex flex-col w-full">{children}</div>
        </CartProvider>
      </body>
    </html>
  );
}