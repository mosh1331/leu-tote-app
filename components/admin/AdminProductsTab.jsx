// components/admin/AdminProductsTab.jsx
'use client';

import { useState } from 'react';
import MultiImageKitUploader from '@/components/MultiImageKitUploader';
import ProductDetailModal from './ProductDetailModal';
import { CATEGORIES, categories } from '@/lib/data';

export default function AdminProductsTab({ products, onRefresh }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [productForm, setProductForm] = useState({
    title: '',
    slug: '',
    category: 'Totes',
    description: '',
    isActive: true,
    selling_price: '',
    offer_price: '',
    size_label: 'Standard',
    stock_quantity: 10,
    images: [],
  });

  const togglePublish = async (id, currentStatus) => {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus }),
    });
    onRefresh();
  };

  const toggleSoldOut = async (id, currentStock) => {
    const newStock = currentStock > 0 ? 0 : 10;
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stockQuantity: newStock }),
    });
    onRefresh();
  };

  const handleDeleteProduct = async (id, title) => {
    if (!confirm(`Delete "${title}"? Associated photos will be purged from ImageKit.`)) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
    else alert('Failed to delete bag');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productForm.images || productForm.images.length === 0) {
      alert('Please upload at least one photo.');
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
              size_label: productForm.size_label,
              selling_price: Number(productForm.selling_price),
              offer_price: Number(productForm.offer_price),
              stock_quantity: Number(productForm.stock_quantity),
            },
          ],
          images: productForm.images,
        }),
      });

      if (!res.ok) throw new Error('Failed to create product');

      setProductForm({
        title: '',
        slug: '',
        category: 'Totes',
        description: '',
        isActive: true,
        selling_price: '',
        offer_price: '',
        size_label: 'Standard',
        stock_quantity: 10,
        images: [],
      });
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Creation Card */}
      <form onSubmit={handleCreateProduct} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Add New Bag SKU</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            placeholder="Title (e.g. Classic Canvas Tote)"
            value={productForm.title}
            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
            className="p-3 text-xs border rounded-xl"
            required
          />
          <input
            placeholder="Slug (optional)"
            value={productForm.slug}
            onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
            className="p-3 text-xs border rounded-xl font-mono"
          />
          <select
            value={productForm.category}
            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
            className="p-3 text-xs border rounded-xl"
          >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
          </select>
          <input
            type="number"
            placeholder="Selling MRP (e.g. 2400)"
            value={productForm.selling_price}
            onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })}
            className="p-3 text-xs border rounded-xl"
            required
          />
          <input
            type="number"
            placeholder="Offer Price (e.g. 2100)"
            value={productForm.offer_price}
            onChange={(e) => setProductForm({ ...productForm, offer_price: e.target.value })}
            className="p-3 text-xs border rounded-xl"
            required
          />
          <input
            placeholder="Size (e.g. Standard, Mini, XL)"
            value={productForm.size_label}
            onChange={(e) => setProductForm({ ...productForm, size_label: e.target.value })}
            className="p-3 text-xs border rounded-xl"
          />
          <input
            type="number"
            placeholder="Initial Stock"
            value={productForm.stock_quantity}
            onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
            className="p-3 text-xs border rounded-xl"
          />
          <div className="sm:col-span-3">
            <MultiImageKitUploader
              folder="/leu-totes/catalog"
              images={productForm.images}
              onChange={(newImages) => setProductForm((prev) => ({ ...prev, images: newImages }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center space-x-2 text-xs font-bold text-gray-700">
            <input
              type="checkbox"
              checked={productForm.isActive}
              onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span>Publish immediately (Uncheck for Draft)</span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#2D3748] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
          >
            {submitting ? 'Saving Bag...' : 'Save Bag'}
          </button>
        </div>
      </form>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
            <tr>
              <th className="p-4">Bag Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">MRP / Offer</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => {
              const primaryVariant = p.variants?.[0] || {};
              const stock = Number(primaryVariant.stock_quantity ?? 0);
              const isSoldOut = stock <= 0;

              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="font-bold text-gray-900 hover:text-indigo-600 text-left block"
                      title="View details & edit"
                    >
                      {p.title} ↗
                    </button>
                    <div className="text-[10px] text-gray-400 font-mono">/{p.slug}</div>
                  </td>
                  <td className="p-4 text-gray-500">{p.category}</td>
                  <td className="p-4">
                    <span className="font-bold">₹{primaryVariant.offer_price || '—'}</span>{' '}
                    <span className="text-gray-400 line-through">₹{primaryVariant.selling_price || '—'}</span>
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
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.is_active ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="text-xs font-bold text-gray-700 hover:underline"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => togglePublish(p.id, p.is_active)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {p.is_active ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => toggleSoldOut(p.id, stock)}
                      className="text-xs font-bold text-amber-700 hover:underline"
                    >
                      {isSoldOut ? 'Restock' : 'Sold Out'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.title)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail / Edit Bag Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}