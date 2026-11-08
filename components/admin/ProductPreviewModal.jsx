// components/admin/ProductPreviewModal.jsx
'use client';

import { useState } from 'react';
import ProductGallery from '@/components/ProductGallery';
import { STORE_INFO } from '@/lib/data';

export default function ProductPreviewModal({ product, onClose, onEdit, onRefresh }) {
  if (!product) return null;

  const [loadingAction, setLoadingAction] = useState(false);
  const primaryVariant = product.variants?.[0] || {};
  const offerPrice = Number(primaryVariant.offer_price || 0);
  const sellingPrice = Number(primaryVariant.selling_price || offerPrice);
  const costPrice = Number(primaryVariant.cost_price || 0);
  const stock = Number(primaryVariant.stock_quantity ?? 0);
  const isPublished = Boolean(product.is_active);

  // Unit profit & margin calculations
  const unitProfit = offerPrice - costPrice;
  const marginPercent = offerPrice > 0 ? Math.round((unitProfit / offerPrice) * 100) : 0;

  const discountPercent =
    sellingPrice > offerPrice
      ? Math.round(((sellingPrice - offerPrice) / sellingPrice) * 100)
      : 0;

  const sortedImages = [...(product.images || [])].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  // Toggle Publish / Draft
  const handleTogglePublish = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !isPublished }),
      });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      alert('Failed to update product status');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete Bag with ImageKit sync
  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${product.title}"? Associated photos will be purged from ImageKit.`
      )
    ) {
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-themeBg-canvas w-full max-w-5xl rounded-theme-xl shadow-2xl border border-black/10 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* 1. Header Bar (Only Breadcrumb & Close Button) */}
        <div className="bg-[#2D3748] text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] uppercase tracking-widest font-black bg-white/20 px-2 py-0.5 rounded">
              Storefront Preview
            </span>
            <span className="text-xs text-gray-300 font-mono hidden sm:inline">
              /products/{product.slug}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors active:scale-95"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* 2. Scrollable Showcase Content */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-themeBg-canvas space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
            
            {/* Left: Product Images Gallery */}
            <div className="lg:col-span-7">
              <ProductGallery
                images={sortedImages}
                title={product.title}
                discountPercent={discountPercent}
              />
            </div>

            {/* Right: Product Details & Margin Analytics */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-theme-xl p-5 sm:p-6 shadow-sm border border-black/[0.06] space-y-4">
                
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-themeText-secondary">
                    {STORE_INFO.name} · {product.category || 'Tote Bags'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isPublished ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-black text-themeText-primary leading-snug">
                  {product.title}
                </h1>

                {/* Customer Facing Pricing */}
                <div className="flex items-baseline space-x-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-themeText-primary">
                    {STORE_INFO.currency}{offerPrice.toLocaleString()}
                  </span>
                  {sellingPrice > offerPrice && (
                    <span className="text-sm sm:text-base text-themeText-secondary line-through">
                      {STORE_INFO.currency}{sellingPrice.toLocaleString()}
                    </span>
                  )}
                  {stock > 0 ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                      In Stock ({stock} available)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Cost Price & Real-time Profit Margin Card */}
                <div
                  className={`p-3.5 rounded-theme-md border text-xs font-semibold space-y-1.5 ${
                    unitProfit >= 0
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/80 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">
                      Cost &amp; Profit Analytics
                    </span>
                    <span className="font-extrabold font-mono text-xs sm:text-sm">
                      {unitProfit >= 0 ? '+' : ''}₹{unitProfit.toLocaleString()} ({marginPercent}% margin)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600 border-t border-emerald-200/60 pt-1.5">
                    <span>Manufacturing Cost (COGS):</span>
                    <strong className="text-gray-900 font-mono">₹{costPrice.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-3 border-t border-black/[0.06]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary mb-1.5">
                    About This Bag
                  </h2>
                  <p className="text-xs sm:text-sm text-themeText-secondary leading-relaxed">
                    {product.description ||
                      'Every Leu Tote is individually cut, shaped, and hand-stitched by our artisans using heavyweight canvas and full-grain leather.'}
                  </p>
                </div>

                {/* Reward Points */}
                <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200/80 p-3 rounded-theme-md text-amber-900 text-xs">
                  <span className="text-base">🎁</span>
                  <span>
                    Customers earn <strong>{Math.round(offerPrice * 0.05)} Leu Points</strong> on this bag!
                  </span>
                </div>

                {/* Creation Timestamp info */}
                {product.created_at && (
                  <p className="text-[11px] text-gray-400 pt-1 font-mono">
                    Created on: {new Date(product.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* 3. Bottom Action Footer (All Action Buttons Consolidated Here) */}
        <div className="bg-white px-4 sm:px-6 py-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          
          {/* Status & Deletion Controls */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={loadingAction}
              onClick={handleTogglePublish}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 ${
                isPublished
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isPublished ? 'Convert to Draft' : 'Publish Product'}
            </button>

            <button
              type="button"
              disabled={loadingAction}
              onClick={handleDelete}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Delete Bag
            </button>
          </div>

          {/* Edit & Close Controls */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-5 py-2 bg-[#2D3748] hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-colors active:scale-95"
            >
              Edit Bag
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}