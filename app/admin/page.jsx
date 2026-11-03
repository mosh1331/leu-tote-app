// app/admin/page.jsx
'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [tab, setTab] = useState('products'); // 'products', 'users', 'orders'
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State for New Product
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
    image_url: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, uRes, oRes] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/orders').then((r) => r.json()),
      ]);
      setProducts(pRes.products || []);
      setUsers(uRes.users || []);
      setOrders(oRes.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle Publish / Draft
  const togglePublish = async (id, currentStatus) => {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus }),
    });
    fetchData();
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: productForm.title,
        slug: productForm.slug || productForm.title.toLowerCase().replace(/ /g, '-'),
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
        images: [{ image_url: productForm.image_url, is_primary: true }],
      }),
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-gray-900 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Leu Tote — Backoffice Portal</h1>
            <p className="text-xs text-gray-500 mt-1">Manage inventory, users, referral tracking, and order fulfillment</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            {['products', 'users', 'orders'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                  tab === t ? 'bg-[#2D3748] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Products (Draft / Publish & Add SKU) */}
        {tab === 'products' && (
          <div className="space-y-6">
            {/* Add Product Form */}
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
                  className="p-3 text-xs border rounded-xl"
                />
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="p-3 text-xs border rounded-xl"
                >
                  <option value="Totes">Totes</option>
                  <option value="Bucket Bags">Bucket Bags</option>
                  <option value="Shoulder Bags">Shoulder Bags</option>
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
                <input
                  placeholder="Image URL (Cloudflare R2 / Supabase)"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="p-3 text-xs border rounded-xl sm:col-span-2"
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span>Publish immediately (Uncheck to Draft)</span>
                </label>
                <button type="submit" className="px-5 py-2.5 bg-[#2D3748] text-white text-xs font-bold rounded-xl shadow-md">
                  Save Bag
                </button>
              </div>
            </form>

            {/* Product Table */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Bag Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">MRP / Offer</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => {
                    const primaryVariant = p.variants?.[0] || {};
                    return (
                      <tr key={p.id}>
                        <td className="p-4 font-bold text-gray-900">{p.title}</td>
                        <td className="p-4 text-gray-500">{p.category}</td>
                        <td className="p-4">
                          <span className="font-bold">₹{primaryVariant.offer_price || '—'}</span>{' '}
                          <span className="text-gray-400 line-through">₹{primaryVariant.selling_price || '—'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {p.is_active ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => togglePublish(p.id, p.is_active)}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            {p.is_active ? 'Unpublish (Draft)' : 'Publish'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Users, Wishlists, Referrals & Redemption Analytics */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Referral Code</th>
                  <th className="p-4">Referrals Made</th>
                  <th className="p-4">Wishlisted</th>
                  <th className="p-4">Available Points</th>
                  <th className="p-4">Orders &amp; Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="p-4">
                      <div className="font-bold">{u.full_name || 'Guest User'}</div>
                      <div className="text-gray-400 text-[11px]">{u.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_registered ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {u.is_registered ? 'Registered' : 'Guest'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold">{u.referral_code || '—'}</td>
                    <td className="p-4 font-bold text-gray-700">{u.successful_referrals || 0}</td>
                    <td className="p-4 font-bold text-pink-600">{u.wishlist_count || 0}</td>
                    <td className="p-4 font-bold text-amber-600">{u.available_points || 0} pts</td>
                    <td className="p-4">
                      <div className="font-bold">₹{Number(u.lifetime_spend).toLocaleString()}</div>
                      <div className="text-gray-400 text-[10px]">{u.total_orders} purchases</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Orders & Code Redemption Verifications */}
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Subtotal / Discount</th>
                  <th className="p-4">Final Paid</th>
                  <th className="p-4">Points Redeemed</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-4 font-mono text-gray-500">#{o.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <div className="font-bold">{o.customer_name}</div>
                      <div className="text-gray-400 text-[10px]">{o.customer_phone}</div>
                    </td>
                    <td className="p-4">
                      ₹{o.subtotal} {o.discount_amount > 0 && <span className="text-red-500">(-₹{o.discount_amount})</span>}
                    </td>
                    <td className="p-4 font-extrabold text-gray-900">₹{o.final_payable}</td>
                    <td className="p-4 text-amber-700 font-bold">{o.points_redeemed || 0} pts</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-gray-100 font-bold text-[10px]">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}