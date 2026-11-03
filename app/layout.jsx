// app/layout.jsx
import './globals.css';
import { STORE_INFO } from '@/lib/data';

export const metadata = {
  metadataBase: new URL(STORE_INFO.siteUrl),
  title: {
    default: `${STORE_INFO.name} | Handcrafted Bags & Utility Totes`,
    template: `%s | ${STORE_INFO.name}`,
  },
  description: STORE_INFO.tagline,
  keywords: ["handmade tote bags", "leather bucket bag", "artisan totes", "leu tote"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-themeBg-canvas text-themeText-primary antialiased flex flex-col">
        {/* Full viewport responsive canvas */}
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </body>
    </html>
  );
}