// components/admin/ProductDetailModal.jsx
'use client';

import { useState } from 'react';
import MultiImageKitUploader from '@/components/MultiImageKitUploader';
import { CATEGORIES } from '@/lib/data';

export default function ProductDetailModal({ product, onClose, onRefresh }) {
  const isPublished = Boolean(product.is_active);
  const primaryVariant = product.variants?.[0] || {};
  const currentStock = Number(primaryVariant.stock_quantity ?? 0);
  const isSoldOut = currentStock <= 0;

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: product.title || '',
    slug: product.slug || '',
    category: product.category || 'Totes',
    description: product.description || '',
    size_label: primaryVariant.size_label || 'Standard',
    selling_price: primaryVariant.selling_price || '',
    offer_price: primaryVariant.offer_price || '',
    cost_price: primaryVariant.cost_price || '',
    stock_quantity: currentStock,
    images: product.images || [],
  });

  // Dynamic Unit Margin Calculations
  const unitOffer = Number(formData.offer_price) || 0;
  const unitCost = Number(formData.cost_price) || 0;
  const profitPerBag = unitOffer - unitCost;
  const marginPercent = unitOffer > 0 ? Math.round((profitPerBag / unitOffer) * 100) : 0;

  // Toggle Publish / Draft
  const handleTogglePublish = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !isPublished }),
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Sold Out / Restock
  const handleToggleSoldOut = async () => {
    setActionLoading(true);
    try {
      const newStock = isSoldOut ? 10 : 0;
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, stockQuantity: newStock }),
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  // Save changes (only allowed for Draft items)
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (isPublished) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          category: formData.category,
          isActive: false, // stays draft
          variants: [
            {
              size_label: formData.size_label,
              selling_price: Number(formData.selling_price),
              offer_price: Number(formData.offer_price),
              cost_price: Number(formData.cost_price) || 0,
              stock_quantity: Number(formData.stock_quantity),
            },
          ],
          images: formData.images,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update bag');
      }

      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl border border-black/10 my-6 space-y-5 flex flex-col max-h-[92vh]">

        {/* 1. Clean Top Header (Only Badges & Title, No Action Buttons) */}
        <div className="flex items-start justify-between border-b pb-4 flex-shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isPublished ? 'PUBLISHED' : 'DRAFT'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSoldOut ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}
              >
                {isSoldOut ? 'SOLD OUT' : `${currentStock} IN STOCK`}
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mt-1">{product.title}</h2>
            <p className="text-xs font-mono text-gray-400">/{product.slug}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold active:scale-95"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* 2. Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Lock Warning for Published Items */}
          {isPublished && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center space-x-2">
              <span>🔒</span>
              <span>
                <strong>Item is Published:</strong> Fields are locked to safeguard live checkouts. Click <strong>"Convert to Draft"</strong> at the bottom to edit pricing, costs, or photos.
              </span>
            </div>
          )}

          <form id="product-detail-form" onSubmit={handleSaveChanges} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Title *</label>
                <input
                  disabled={isPublished}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 disabled:text-gray-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Slug *</label>
                <input
                  disabled={isPublished}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 disabled:text-gray-500 font-mono bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Category</label>
                <select
                  disabled={isPublished}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 bg-white"
                >
                  {CATEGORIES?.map((cat) => (
                    <option key={cat.id} value={cat.name || cat.id}>
                      {cat.name}
                    </option>
                  )) || (
                    <>
                      <option value="Totes">Totes</option>
                      <option value="Bucket Bags">Bucket Bags</option>
                      <option value="Shoulder Bags">Shoulder Bags</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  inputMode="numeric"
                  disabled={isPublished}
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 bg-white"
                />
              </div>
            </div>

            {/* Pricing, Cost & Margin Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Selling MRP (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  disabled={isPublished}
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Offer Price (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  disabled={isPublished}
                  value={formData.offer_price}
                  onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                  Cost Price (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  disabled={isPublished}
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full h-10 px-3 text-base sm:text-xs border border-emerald-300 bg-emerald-50/40 rounded-xl disabled:bg-gray-100 font-semibold text-emerald-950"
                  required
                />
              </div>
            </div>

            {/* Profit Margin Preview Card */}
            {(formData.offer_price || formData.cost_price) && (
              <div
                className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-semibold ${
                  profitPerBag >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>Unit Cost: <strong>₹{unitCost.toLocaleString()}</strong></span>
                  <span>|</span>
                  <span>Offer: <strong>₹{unitOffer.toLocaleString()}</strong></span>
                </div>
                <div className="font-extrabold font-mono text-xs sm:text-sm">
                  Margin: {profitPerBag >= 0 ? '+' : ''}₹{profitPerBag.toLocaleString()} ({marginPercent}%)
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Description</label>
              <textarea
                rows="3"
                disabled={isPublished}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 text-base sm:text-xs border rounded-xl disabled:bg-gray-100 bg-white"
              />
            </div>

            {/* Photo Management */}
            <div className="pt-2 border-t border-black/5">
              <MultiImageKitUploader
                folder="/leu-totes/catalog"
                images={formData.images}
                disabled={isPublished}
                onChange={(updated) => setFormData({ ...formData, images: updated })}
              />
            </div>
          </form>
        </div>

        {/* 3. Bottom Actions Bar (All Action Buttons Consolidated Here) */}
        <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0 bg-white">
          {/* Left Actions: Status Toggle & Stock Quick Action */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleTogglePublish}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                isPublished
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isPublished ? 'Convert to Draft' : 'Publish Product'}
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleToggleSoldOut}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                isSoldOut
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              {isSoldOut ? 'Restock (Set to 10)' : 'Mark Sold Out'}
            </button>
          </div>

          {/* Right Actions: Close & Save Changes */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95"
            >
              Close
            </button>

            {!isPublished && (
              <button
                type="submit"
                form="product-detail-form"
                disabled={saving}
                className="px-5 py-2 bg-[#2D3748] hover:bg-black text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 active:scale-95"
              >
                {saving ? 'Saving...' : 'Save Draft Edits'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}