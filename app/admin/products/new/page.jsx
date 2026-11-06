// app/admin/products/new/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiImageKitUploader from '@/components/MultiImageKitUploader';

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    title: '',
    slug: '',
    category: 'Totes',
    description: '',
    isActive: true,
    selling_price: '',
    offer_price: '',
    stock_quantity: 10,
    images: [],
  });

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productForm.images || productForm.images.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    setSubmitting(true);
    try {
      const computedSlug = (productForm.slug || productForm.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productForm.title,
          slug: computedSlug,
          description: productForm.description,
          category: productForm.category,
          isActive: productForm.isActive,
          variants: [
            {
              size_label: 'Standard',
              color_label: null,
              selling_price: Number(productForm.selling_price),
              offer_price: Number(productForm.offer_price),
              stock_quantity: Number(productForm.stock_quantity),
            },
          ],
          images: productForm.images,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create product');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-gray-900 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-black py-2 active:scale-95"
          >
            <span>←</span>
            <span>Back to Inventory</span>
          </Link>
          <span className="text-xs font-semibold text-gray-500">Leu Tote Studio</span>
        </div>

        {/* Creation Card */}
        <form
          onSubmit={handleCreateProduct}
          className="bg-white rounded-2xl p-5 sm:p-8 border border-black/5 shadow-sm space-y-5"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Add New Bag
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter bag pricing, stock, and upload studio photos.
            </p>
          </div>

          <div className="space-y-4">
            {/* Title - text-base prevents iOS zoom */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Bag Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Classic Canvas Tote — Olive Green"
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                className="w-full h-11 sm:h-10 px-3.5 text-base sm:text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
                required
              />
            </div>

            {/* Category & Slug Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Category *
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                >
                  <option value="Totes">Totes</option>
                  <option value="Bucket Bags">Bucket Bags</option>
                  <option value="Shoulder Bags">Shoulder Bags</option>
                  <option value="Crossbody">Crossbody</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="auto-generated from title"
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                  className="w-full h-11 sm:h-10 px-3.5 text-base sm:text-xs font-mono border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
                />
              </div>
            </div>

            {/* Pricing & Stock Row */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1 truncate">
                  MRP (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="2400"
                  value={productForm.selling_price}
                  onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })}
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1 truncate">
                  Offer (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="2100"
                  value={productForm.offer_price}
                  onChange={(e) => setProductForm({ ...productForm, offer_price: e.target.value })}
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1 truncate">
                  Stock *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="10"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Description &amp; Specifications
              </label>
              <textarea
                rows={3}
                placeholder="Handcrafted organic canvas, antique brass hardware, inner compartments..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full p-3 text-base sm:text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
              />
            </div>

            {/* Multi-ImageKit Uploader with anti-zoom padding */}
            <div className="pt-2 border-t border-black/5">
              <MultiImageKitUploader
                folder="/leu-totes/catalog"
                images={productForm.images}
                onChange={(newImages) =>
                  setProductForm((prev) => ({ ...prev, images: newImages }))
                }
              />
            </div>

            {/* Publish Toggle */}
            <div className="pt-2 border-t border-black/5">
              <label className="flex items-center space-x-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-md text-gray-900 focus:ring-black cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                  Publish immediately (Uncheck to save as Draft)
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-black/5 flex items-center justify-end space-x-3">
            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#2D3748] hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}