// app/admin/page.jsx
'use client';

import { useState, useEffect } from 'react';
import AdminProductsTab from '@/components/admin/AdminProductsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';

export default function AdminDashboard() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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
      console.error('Error fetching admin datasets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-gray-900 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Leu Tote — Backoffice Portal</h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage inventory, users, referral tracking, and order fulfillment
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            {['products', 'users', 'orders'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                  tab === t
                    ? 'bg-[#2D3748] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Views */}
        {loading && products.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs font-bold">
            Loading Backoffice Data...
          </div>
        ) : (
          <>
            {tab === 'products' && (
              <AdminProductsTab products={products} onRefresh={fetchData} />
            )}
            {tab === 'users' && <AdminUsersTab users={users} />}
            {tab === 'orders' && <AdminOrdersTab orders={orders} />}
          </>
        )}

      </div>
    </div>
  );
}