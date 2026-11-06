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
    <div className="min-h-screen bg-[#F4F5F0] text-gray-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-black/5 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Leu Tote — Backoffice
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Inventory, users, points, and orders
            </p>
          </div>

          {/* Navigation Tabs (Horizontal Touch Ribbon on Mobile) */}
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {['products', 'users', 'orders'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-xs font-bold">
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