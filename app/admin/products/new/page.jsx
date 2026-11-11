// app/admin/products/new/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiImageKitUploader from '@/components/MultiImageKitUploader';
import { CATEGORIES } from '@/lib/data';

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
    cost_price: '',
    stock_quantity: 10,
    images: [],
  });

  const offer = Number(productForm.offer_price) || 0;
  const cost = Number(productForm.cost_price) || 0;

  // Tax & Gateway Deductions (Assuming standard 5% inclusive GST + 2% Razorpay with 18% GST)
  const GST_RATE = 0.05;
  const taxableBase = offer > 0 ? offer / (1 + GST_RATE) : 0;
  const gstAmount = offer - taxableBase;

  // Razorpay 2% + 18% GST on fee = 2.36% of gross value
  const rzpFeeTotal = offer * 0.02 * 1.18;

  // True Realized Payout into Bank
  const netBankPayout = offer > 0 ? offer - gstAmount - rzpFeeTotal : 0;
  const netRealizedProfit = netBankPayout - cost;
  const trueMarginPercent = offer > 0 ? Math.round((netRealizedProfit / offer) * 100) : 0;
  const grossProfit = offer - cost;
  const marginPercent = offer > 0 ? Math.round((grossProfit / offer) * 100) : 0;

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
              cost_price: Number(productForm.cost_price) || 0,
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
    <div className="min-h-screen bg-themeBg-canvas text-themeText-primary p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Navigation */}
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

        {/* Form Container */}
        <form
          onSubmit={handleCreateProduct}
          className="bg-white rounded-theme-xl p-5 sm:p-8 border border-black/5 shadow-sm space-y-5"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-themeText-primary tracking-tight">
              Add New Bag
            </h1>
            <p className="text-xs text-themeText-secondary mt-0.5">
              Enter product details, manufacturing cost, and upload studio photos.
            </p>
          </div>

          <div className="space-y-4">
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
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
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

            {/* Pricing, Cost & Stock Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1 truncate">
                  Selling MRP (₹) *
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
                  Offer Price (₹) *
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
                <label className="text-xs font-bold text-emerald-800 block mb-1 truncate">
                  Cost Price (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="750"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-xs border border-emerald-300 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold"
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

            {/* Dynamic Net In-Hand & Profit Breakdown Card */}
            {(productForm.offer_price || productForm.cost_price) && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${netRealizedProfit >= 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    Estimated Bank Settlement &amp; Net Profit
                  </span>
                  <span className="font-extrabold font-mono text-sm">
                    Net Profit: {netRealizedProfit >= 0 ? '+' : ''}₹{netRealizedProfit.toFixed(2)} ({trueMarginPercent}% margin)
                  </span>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Offer Price:</span>
                    <strong className="text-gray-900 font-mono">₹{offer.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">GST Output (5% incl):</span>
                    <strong className="text-amber-800 font-mono">-₹{gstAmount.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Razorpay (2.36%):</span>
                    <strong className="text-red-700 font-mono">-₹{rzpFeeTotal.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Net Bank In-Hand:</span>
                    <strong className="text-emerald-800 font-mono">₹{netBankPayout.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Product description, stitching details, and fabric specs..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full p-3 text-base sm:text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
              />
            </div>

            <div className="pt-2 border-t border-black/5">
              <MultiImageKitUploader
                folder="/leu-totes/catalog"
                images={productForm.images}
                onChange={(newImages) =>
                  setProductForm((prev) => ({ ...prev, images: newImages }))
                }
              />
            </div>

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
              className="px-6 py-3 bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}