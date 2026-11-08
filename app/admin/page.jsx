// app/admin/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminProductsTab from '@/components/admin/AdminProductsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminRevenueTab from '@/components/admin/AdminRevenueTab';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to lock and sign out of the Backoffice?')) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      alert('Failed to log out');
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-themeBg-canvas text-gray-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-theme-xl shadow-sm border border-black/5 gap-4">
          <div className="w-full">
            <div className="w-full flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-black text-themeText-primary tracking-tight">
                Backoffice
              </h1>
              {/* Sign Out / Lock Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-theme-md bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-black/5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                title="Lock Admin Portal"
              >
                <span>🔒</span>
                <span>{loggingOut ? 'Locking...' : 'Sign Out'}</span>
              </button>
            </div>
            <p className="text-xs text-themeText-secondary mt-0.5">
              Inventory, users, points, and order fulfillment
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Switcher Ribbon */}
            <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-theme-md overflow-x-auto">
              {['products', 'users', 'orders', 'revenue'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${tab === t
                    ? 'bg-white text-themeText-primary shadow-sm'
                    : 'text-themeText-secondary hover:text-themeText-primary'
                    }`}
                >
                  {t === 'revenue' ? '📈 Revenue & POS' : t}
                </button>
              ))}
            </div>


          </div>
        </div>

        {/* Tab Views */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20 text-themeText-secondary text-xs font-bold">
            Loading Backoffice Data...
          </div>
        ) : (
          <>
            {tab === 'products' && (
              <AdminProductsTab products={products} onRefresh={fetchData} />
            )}
            {tab === 'users' && <AdminUsersTab users={users} />}
            {tab === 'orders' && <AdminOrdersTab orders={orders} />}
            {tab === 'revenue' && (
              <AdminRevenueTab products={products} onRefresh={fetchData} />
            )}
          </>
        )}

      </div>
    </div>
  );
}