// components/admin/ProductDetailModal.jsx
'use client';

import { useState } from 'react';
import MultiImageKitUploader from '@/components/MultiImageKitUploader';

export default function ProductDetailModal({ product, onClose, onRefresh }) {
  const isPublished = Boolean(product.is_active);
  const primaryVariant = product.variants?.[0] || {};
  const currentStock = Number(primaryVariant.stock_quantity ?? 0);
  const isSoldOut = currentStock <= 0;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: product.title || '',
    slug: product.slug || '',
    category: product.category || 'Totes',
    description: product.description || '',
    size_label: primaryVariant.size_label || 'Standard',
    selling_price: primaryVariant.selling_price || '',
    offer_price: primaryVariant.offer_price || '',
    stock_quantity: currentStock,
    images: product.images || [],
  });

  // Toggle Publish / Draft
  const handleTogglePublish = async () => {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, isActive: !isPublished }),
    });
    onRefresh();
    onClose();
  };

  // Toggle Sold Out / Restock
  const handleToggleSoldOut = async () => {
    const newStock = isSoldOut ? 10 : 0;
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, stockQuantity: newStock }),
    });
    onRefresh();
    onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-black/10 my-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b pb-4">
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
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Status Actions: Publish Switch & Sold Out Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-700">Status Switch:</span>
            <button
              type="button"
              onClick={handleTogglePublish}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                isPublished
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPublished ? 'Convert to Draft' : 'Publish Product'}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-700">Stock Quick Action:</span>
            <button
              type="button"
              onClick={handleToggleSoldOut}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSoldOut
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              {isSoldOut ? 'Restock (Set to 10)' : 'Mark as Sold Out'}
            </button>
          </div>
        </div>

        {/* Lock Warning for Published Items */}
        {isPublished && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center space-x-2">
            <span>🔒</span>
            <span>
              <strong>Item is Published:</strong> Fields are locked against accidental edits to protect live customer checkouts. Click <strong>"Convert to Draft"</strong> above if you need to modify details or photos.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Title</label>
              <input
                disabled={isPublished}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100 disabled:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Slug</label>
              <input
                disabled={isPublished}
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100 disabled:text-gray-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Category</label>
              <select
                disabled={isPublished}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100"
              >
                <option value="Totes">Totes</option>
                <option value="Bucket Bags">Bucket Bags</option>
                <option value="Shoulder Bags">Shoulder Bags</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Size Label</label>
              <input
                disabled={isPublished}
                value={formData.size_label}
                onChange={(e) => setFormData({ ...formData, size_label: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Selling Price (MRP)</label>
              <input
                type="number"
                disabled={isPublished}
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Offer Price</label>
              <input
                type="number"
                disabled={isPublished}
                value={formData.offer_price}
                onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Stock Quantity</label>
              <input
                type="number"
                disabled={isPublished}
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Description</label>
              <textarea
                rows="3"
                disabled={isPublished}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Photo Management */}
          <div className="pt-2">
            <MultiImageKitUploader
              folder="/leu-totes/catalog"
              images={formData.images}
              disabled={isPublished}
              onChange={(updated) => setFormData({ ...formData, images: updated })}
            />
          </div>

          {/* Footer Controls */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>

            {!isPublished && (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#2D3748] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Draft Edits'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}