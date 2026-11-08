// components/admin/AdminOrdersTab.jsx
'use client';

import { useState, useMemo } from 'react';
import OrderDetailModal from './OrderDetailModal';

export default function AdminOrdersTab({ orders = [], onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 1. Operational Counts
  const toDispatchCount = useMemo(() => {
    return orders.filter((o) => (o.status || '').toUpperCase() === 'PAID').length;
  }, [orders]);

  const inTransitCount = useMemo(() => {
    return orders.filter((o) => {
      const s = (o.status || '').toUpperCase();
      return s === 'SHIPPED' || s === 'PACKED';
    }).length;
  }, [orders]);

  // 2. Filter Logic (Search, Status, Date)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    return orders.filter((o) => {
      const orderStatus = (o.status || 'PENDING').toUpperCase();
      const orderDate = o.created_at ? new Date(o.created_at) : null;

      // Status Filter
      if (statusFilter === 'TO_DISPATCH' && orderStatus !== 'PAID') return false;
      if (statusFilter === 'DISPATCHED' && orderStatus !== 'SHIPPED' && orderStatus !== 'PACKED') return false;
      if (statusFilter === 'DELIVERED' && orderStatus !== 'DELIVERED') return false;
      if (statusFilter === 'PENDING' && orderStatus !== 'PENDING') return false;
      if (statusFilter === 'CANCELLED' && orderStatus !== 'CANCELLED' && orderStatus !== 'RETURNED') return false;

      // Date Preset Filter
      if (orderDate) {
        if (datePreset === 'TODAY') {
          if (orderDate < startOfToday) return false;
        } else if (datePreset === 'YESTERDAY') {
          if (orderDate < startOfYesterday || orderDate >= startOfToday) return false;
        } else if (datePreset === '7D') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (orderDate < sevenDaysAgo) return false;
        } else if (datePreset === '30D') {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (orderDate < thirtyDaysAgo) return false;
        } else if (datePreset === 'CUSTOM') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
          }
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (o.id || '').toLowerCase().includes(q);
        const matchesName = (o.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (o.customer_phone || '').includes(q);
        if (!matchesId && !matchesName && !matchesPhone) return false;
      }

      return true;
    });
  }, [orders, statusFilter, datePreset, customStartDate, customEndDate, searchQuery]);

  // Formatter for Date + Time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' || datePreset !== 'ALL' || searchQuery !== '';

  return (
    <div className="space-y-5 font-sans">
      
      {/* 1. TOP OPERATIONAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: To Dispatch */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'TO_DISPATCH' ? 'ALL' : 'TO_DISPATCH')}
          className={`cursor-pointer p-5 rounded-theme-xl border transition-all active:scale-[0.99] shadow-sm relative overflow-hidden ${
            statusFilter === 'TO_DISPATCH'
              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-black/5 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
                ⏳
              </div>
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  To Dispatch (Paid Orders)
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Payment confirmed · Awaiting packing / courier pickup
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-mono text-amber-700">
                {toDispatchCount}
              </span>
              <span className="text-[10px] block font-bold text-gray-400">
                {statusFilter === 'TO_DISPATCH' ? 'Active Filter' : 'Tap to filter'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Dispatched */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'DISPATCHED' ? 'ALL' : 'DISPATCHED')}
          className={`cursor-pointer p-5 rounded-theme-xl border transition-all active:scale-[0.99] shadow-sm relative overflow-hidden ${
            statusFilter === 'DISPATCHED'
              ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-black/5 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                🚚
              </div>
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  Dispatched (In Transit)
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Handed to courier · Pending customer delivery
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-mono text-blue-700">
                {inTransitCount}
              </span>
              <span className="text-[10px] block font-bold text-gray-400">
                {statusFilter === 'DISPATCHED' ? 'Active Filter' : 'Tap to filter'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER CONTROLS: SEARCH, STATUS, DATE-WISE */}
      <div className="bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm space-y-3.5">
        
        {/* Search & Status Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, customer name, or phone..."
              className="w-full h-10 pl-9 pr-8 text-base sm:text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-gray-50/50"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Dropdown / Select */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-base sm:text-xs font-bold border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              <option value="TO_DISPATCH">⏳ To Dispatch (PAID)</option>
              <option value="DISPATCHED">🚚 Dispatched (SHIPPED/PACKED)</option>
              <option value="DELIVERED">✓ Delivered</option>
              <option value="PENDING">⚠️ Pending / Unpaid</option>
              <option value="CANCELLED">✕ Cancelled / Returned</option>
            </select>
          </div>
        </div>

        {/* Date Filter Presets Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 mr-1">Date:</span>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: '7D', label: 'Last 7 Days' },
              { id: '30D', label: 'Last 30 Days' },
              { id: 'CUSTOM', label: 'Custom Range' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDatePreset(d.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                  datePreset === d.id
                    ? 'bg-[#2D3748] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Custom Date Range Pickers (Visible only when 'CUSTOM' is selected) */}
        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 animate-fade-in">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-gray-600">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 px-3 text-base sm:text-xs border rounded-lg bg-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-gray-600">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 px-3 text-base sm:text-xs border rounded-lg bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. ORDERS LEDGER TABLE */}
      <div className="bg-white rounded-theme-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-themeText-primary">Orders Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Date &amp; Time</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items / Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => {
                  const currentStatus = (o.status || 'PENDING').toUpperCase();
                  const isOffline = (o.channel || '').toUpperCase() === 'OFFLINE';

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Order ID */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-themeText-primary block">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* Order Date with Exact Time */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-800 block">
                          {formatDateTime(o.created_at)}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="font-bold text-themeText-primary">
                          {o.customer_name || 'Guest'}
                        </div>
                        <div className="text-gray-400 text-[10px]">{o.customer_phone || '—'}</div>
                      </td>

                      {/* Line Items & Channel */}
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-700">
                            {o.items?.length || 1} {o.items?.length === 1 ? 'bag' : 'bags'}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isOffline ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {isOffline ? 'OFFLINE' : 'ONLINE'}
                          </span>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            currentStatus === 'PAID'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : currentStatus === 'SHIPPED' || currentStatus === 'PACKED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : currentStatus === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : currentStatus === 'CANCELLED' || currentStatus === 'RETURNED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors active:scale-95 text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Order Modal with Full Details & Actions */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={onRefresh}
        />
      )}

    </div>
  );
}