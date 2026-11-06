// components/admin/AdminProductsTab.jsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductDetailModal from './ProductDetailModal';
import ProductPreviewModal from './ProductPreviewModal';

export default function AdminProductsTab({ products, onRefresh }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'DRAFT'
  const [stockFilter, setStockFilter] = useState('ALL');   // 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'

  // Filtered dataset
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const primaryVariant = p.variants?.[0] || {};
      const stock = Number(primaryVariant.stock_quantity ?? 0);

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);

      // Status match
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && p.is_active) ||
        (statusFilter === 'DRAFT' && !p.is_active);

      // Stock match
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && stock > 0) ||
        (stockFilter === 'OUT_OF_STOCK' && stock <= 0);

      return matchesSearch && matchesStatus && matchesStock;
    });
  }, [products, searchQuery, statusFilter, stockFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-sm gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Inventory Catalog</h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center space-x-1.5 px-4 sm:px-5 py-2.5 bg-[#2D3748] hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <span>+</span>
          <span>Add Bag</span>
        </Link>
      </div>

      {/* Filter Controls: Search & Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, slug, or category..."
              className="w-full h-10 pl-9 pr-3 text-base sm:text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-gray-50/50"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'PUBLISHED', label: 'Published' },
              { id: 'DRAFT', label: 'Draft' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  statusFilter === s.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Stock Filter Buttons */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Stock' },
              { id: 'IN_STOCK', label: 'In Stock' },
              { id: 'OUT_OF_STOCK', label: 'Sold Out' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStockFilter(st.id)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  stockFilter === st.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

        </div>

        {/* Clear Filters Reset Option */}
        {(searchQuery || statusFilter !== 'ALL' || stockFilter !== 'ALL') && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-gray-500">Active filters applied</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setStockFilter('ALL');
              }}
              className="text-indigo-600 hover:underline font-bold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-black/5 shadow-sm space-y-2">
          <p className="text-sm font-bold text-gray-700">No products match your filters</p>
          <p className="text-xs text-gray-400">Try modifying your search or filter options</p>
        </div>
      )}

      {/* MOBILE VIEW (< md): Touch-Friendly Cards with Creation Date */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((p) => {
          const primaryVariant = p.variants?.[0] || {};
          const stock = Number(primaryVariant.stock_quantity ?? 0);
          const isSoldOut = stock <= 0;
          const heroImg = p.images?.[0]?.image_url || '/placeholder.png';

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3"
            >
              <div className="flex items-center space-x-3.5">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-black/5">
                  <Image src={heroImg} alt={p.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.is_active ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isSoldOut ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {isSoldOut ? 'SOLD OUT' : `${stock} IN STOCK`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 truncate mt-1">{p.title}</h3>
                  
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="font-extrabold text-gray-900">
                      ₹{primaryVariant.offer_price || 0}
                    </span>
                    {/* Creation Date Badge */}
                    <span className="text-[10px] text-gray-400">
                      Created: {formatDate(p.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* View & Edit Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(p)}
                  className="py-2.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl active:scale-95 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>👁️</span>
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(p)}
                  className="py-2.5 text-xs font-bold text-white bg-[#2D3748] hover:bg-black rounded-xl active:scale-95 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (md+): Table with Created Date Column */}
      <div className="hidden md:block bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
            <tr>
              <th className="p-4">Bag Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Created Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((p) => {
              const primaryVariant = p.variants?.[0] || {};
              const stock = Number(primaryVariant.stock_quantity ?? 0);
              const isSoldOut = stock <= 0;

              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(p)}
                      className="font-bold text-gray-900 hover:text-indigo-600 text-left block"
                    >
                      {p.title}
                    </button>
                    <div className="text-[10px] text-gray-400 font-mono">/{p.slug}</div>
                  </td>
                  <td className="p-4 text-gray-500">{p.category}</td>
                  <td className="p-4">
                    <span className="font-bold">₹{primaryVariant.offer_price || '—'}</span>{' '}
                    <span className="text-gray-400 line-through">
                      ₹{primaryVariant.selling_price || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSoldOut ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {isSoldOut ? 'SOLD OUT' : `${stock} in stock`}
                    </span>
                  </td>
                  
                  {/* Created Date Column */}
                  <td className="p-4 text-gray-500 font-mono text-[11px]">
                    {formatDate(p.created_at)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.is_active ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(p)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="px-3 py-1.5 bg-[#2D3748] hover:bg-black text-white font-bold rounded-lg transition-colors shadow-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 1. PDP-Style Preview Modal (with Publish/Draft & Delete buttons) */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onEdit={(prod) => setEditingProduct(prod)}
          onRefresh={onRefresh}
        />
      )}

      {/* 2. Management & Edit Modal */}
      {editingProduct && (
        <ProductDetailModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}