// components/WhatsAppShareButton.jsx
'use client';
import { STORE_INFO } from '@/lib/data';

export default function WhatsAppShareButton({ product }) {
  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/products/${product.slug}`
    : `${STORE_INFO.siteUrl}/products/${product.slug}`;

  const message = `✨ *${product.title}* from Leu Tote\n` +
    `🏷️ *Offer Price:* ${STORE_INFO.currency}${product.offer_price} (MRP: ~${STORE_INFO.currency}${product.selling_price}~)\n` +
    `🎁 *Rewards:* Earn ${product.points_reward} pts on purchase!\n\n` +
    `Tap to view bag and claim offer:\n${productUrl}`;

  return (
    <a
      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium text-sm rounded-theme-md shadow-sm transition-all"
    >
      <span>Share Offer on WhatsApp</span>
    </a>
  );
}