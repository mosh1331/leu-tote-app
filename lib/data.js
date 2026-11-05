// lib/data.js
export const STORE_INFO = {
  name: "Leu Tote",
  tagline: "Handcrafted Bags & Everyday Utility",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://leutote.com",
  currency: "₹",
  whatsappNumber: "+919876543210"
};

export const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: "mother", name: "Mother Bags" },
  { id: "totes", name: "Totes" },
  { id: "utility", name: "Utility Bags" },
  { id: "pouch", name: "Pouches" },
  { id: "organizers", name: "Organizers" },
  { id: "materials", name: "Materials" },
];

export const PRODUCTS = [
  {
    id: "leu-ophidia-tote",
    slug: "classic-artisan-tote-bag",
    title: "Classic Artisan Large Tote",
    category: "totes",
    description: "Handcrafted heavyweight organic canvas with top-grain leather straps, reinforced bottom base, and magnetic closure.",
    selling_price: 1800,
    offer_price: 1750,
    stock_quantity: 9,
    points_reward: 90,
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Oatmeal Beige", hex: "#E8E4D9" },
      { name: "Off White", hex: "#F5F5F0" },
      { name: "Charcoal Black", hex: "#1F2022" }
    ],
    sizes: ["Standard", "Large"]
  },
  {
    id: "leu-bucket-drawstring",
    slug: "drawstring-leather-bucket-bag",
    title: "Grained Leather Bucket Bag",
    category: "buckets",
    description: "Compact cylindrical bucket bag featuring an adjustable shoulder strap, brass eyelets, and drawstring closure.",
    selling_price: 2250,
    offer_price: 2200,
    stock_quantity: 6,
    points_reward: 110,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Cream Monogram", hex: "#E8E4D9" },
      { name: "Jet Black", hex: "#111111" },
      { name: "Warm Cedar", hex: "#7E482C" },
      { name: "Rust", hex: "#943922" }
    ],
    sizes: ["One Size"]
  },
  {
    id: "leu-swinger-shoulder",
    slug: "minimal-swinger-shoulder-bag",
    title: "Minimal Curve Shoulder Bag",
    category: "shoulder",
    description: "Sleek curved baguette silhouette with zip-top entry and structured leather body for evening and daily wear.",
    selling_price: 2800,
    offer_price: 2500,
    stock_quantity: 12,
    points_reward: 125,
    images: [
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Chalk", hex: "#FAF8F5" },
      { name: "Noir", hex: "#1A1A1A" }
    ],
    sizes: ["Small", "Standard"]
  },
  {
    id: "leu-slouchy-hobo",
    slug: "brooklyn-slouchy-shoulder-bag",
    title: "Slouchy Day Hobo Bag 23",
    category: "shoulder",
    description: "Supple full-grain pebble leather with gold hardware accents, detachable shoulder strap, and interior zipper pocket.",
    selling_price: 2300,
    offer_price: 2250,
    stock_quantity: 8,
    points_reward: 115,
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Jet Black", hex: "#111111" },
      { name: "Tan Cognac", hex: "#B47C53" },
      { name: "Chestnut", hex: "#6E3A27" }
    ],
    sizes: ["23 cm", "28 cm"]
  },
  {
    id: "leu-linen-beach-tote",
    slug: "linen-utility-carryall-bag",
    title: "Utility Carryall Canvas Tote",
    category: "totes",
    description: "Wide base multi-pocket carryall built with waterproof coated interior lining and double reinforced grab handles.",
    selling_price: 4700,
    offer_price: 4500,
    stock_quantity: 4,
    points_reward: 225,
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Ivory Linen", hex: "#F3F2EE" },
      { name: "Onyx", hex: "#1A1A1A" }
    ],
    sizes: ["One Size"]
  },
  {
    id: "leu-everyday-crossbody",
    slug: "commute-compact-crossbody",
    title: "Commute Compact Crossbody",
    category: "crossbody",
    description: "Featherlight utility pouch bag designed for keys, phone, and daily compact essentials with an adjustable nylon cord strap.",
    selling_price: 1500,
    offer_price: 1350,
    stock_quantity: 15,
    points_reward: 70,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Sage Green", hex: "#98A78F" },
      { name: "Onyx", hex: "#1A1A1A" }
    ],
    sizes: ["Compact"]
  }
];
