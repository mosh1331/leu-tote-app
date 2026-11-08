// components/admin/AdminRevenueTab.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import QuickPosModal from './QuickPosModal';

export default function AdminRevenueTab({ products = [], onRefresh }) {
  const [channelView, setChannelView] = useState('COMBINED'); // 'COMBINED' | 'ONLINE' | 'OFFLINE'
  const [timeRange, setTimeRange] = useState('all');          // '7d' | '30d' | 'all'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosOpen, setIsPosOpen] = useState(false);

  // Fetch segmented revenue analytics and order ledger
  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch(`/api/admin/analytics/revenue?range=${timeRange}`).then((r) => r.json()),
        fetch('/api/admin/orders').then((r) => r.json()),
      ]);

      setAnalyticsData(analyticsRes);
      setOrders(ordersRes.orders || []);
    } catch (err) {
      console.error('Failed to load revenue analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  // Extract selected channel stats
  const activeStats = useMemo(() => {
    if (!analyticsData) {
      return { net_revenue: 0, total_cogs: 0, net_profit: 0, total_orders: 0 };
    }
    if (channelView === 'ONLINE') return analyticsData.online || {};
    if (channelView === 'OFFLINE') return analyticsData.offline || {};
    return analyticsData.combined || {};
  }, [analyticsData, channelView]);

  const netRevenue = Number(activeStats.net_revenue || 0);
  const totalCogs = Number(activeStats.total_cogs || 0);
  const netProfit = Number(activeStats.net_profit || 0);
  const marginPct = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 100) : 0;

  // Split Comparison calculation for progress bar
  const onlineRev = Number(analyticsData?.online?.net_revenue || 0);
  const offlineRev = Number(analyticsData?.offline?.net_revenue || 0);
  const totalChannelRev = onlineRev + offlineRev;
  const onlineShare = totalChannelRev > 0 ? Math.round((onlineRev / totalChannelRev) * 100) : 0;
  const offlineShare = totalChannelRev > 0 ? 100 - onlineShare : 0;

  // Recent Offline Sales Ledger
  const recentOfflineOrders = useMemo(() => {
    return orders
      .filter((o) => (o.channel || '').toUpperCase() === 'OFFLINE')
      .slice(0, 15);
  }, [orders]);

  return (
    <div className="space-y-5 font-sans">
      
      {/* Top Controls: Channel Toggle, Period Filter & POS Action */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm gap-3">
        
        {/* Channel Segmented Buttons */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-theme-md overflow-x-auto">
          {[
            { id: 'COMBINED', label: 'Combined Overview' },
            { id: 'ONLINE', label: '🌐 Online Store' },
            { id: 'OFFLINE', label: '🏪 Offline / Pop-ups' },
          ].map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannelView(ch.id)}
              className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                channelView === ch.id
                  ? 'bg-white text-themeText-primary shadow-sm'
                  : 'text-themeText-secondary hover:text-themeText-primary'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Time Period Filter & Open POS Drawer CTA */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-theme-md text-xs font-semibold">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'all', label: 'All' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                className={`px-2.5 py-1.5 rounded-md font-bold transition-all ${
                  timeRange === t.id
                    ? 'bg-themePrimary text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsPosOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-theme-md shadow-md active:scale-95 transition-all"
          >
            <span>⚡</span>
            <span>Record Offline Sale</span>
          </button>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Net Sales Revenue
          </span>
          <p className="text-lg sm:text-2xl font-black text-themeText-primary">
            ₹{netRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">
            {activeStats.total_orders || 0} orders recorded
          </span>
        </div>

        {/* Total COGS */}
        <div className="bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Total COGS (Cost)
          </span>
          <p className="text-lg sm:text-2xl font-black text-gray-700">
            ₹{totalCogs.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">
            Direct production expense
          </span>
        </div>

        {/* Total Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Total Net Profit
          </span>
          <p
            className={`text-lg sm:text-2xl font-black ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold">
            Realized cash margin
          </span>
        </div>

        {/* Profit Margin % */}
        <div className="bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Profit Margin
          </span>
          <p className="text-lg sm:text-2xl font-black text-indigo-700">
            {marginPct}%
          </p>
          <span className="text-[10px] text-gray-500 font-medium">
            Net over gross sales
          </span>
        </div>
      </div>

      {/* Online vs Offline Revenue Breakdown Progress Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-theme-xl border border-black/5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-themeText-primary">Channel Sales Split</span>
          <span className="text-gray-500 font-mono">
            Online: ₹{onlineRev.toLocaleString()} ({onlineShare}%) · Offline: ₹{offlineRev.toLocaleString()} ({offlineShare}%)
          </span>
        </div>

        <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${onlineShare}%` }}
            className="bg-themePrimary transition-all duration-500"
            title={`Online: ${onlineShare}%`}
          />
          <div
            style={{ width: `${offlineShare}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Offline: ${offlineShare}%`}
          />
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-gray-500 pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-themePrimary" />
            <span>Online Webstore ({onlineShare}%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Exhibitions &amp; Pop-ups ({offlineShare}%)</span>
          </div>
        </div>
      </div>

      {/* Recent Offline Sales Ledger */}
      <div className="bg-white rounded-theme-xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-themeText-primary">
              Recent Offline / Exhibition Sales
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live transactions recorded from booths, flea markets, and studio visits[cite: 1].
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPosOpen(true)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            + New Sale
          </button>
        </div>

        {recentOfflineOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No offline sales recorded yet. Tap "Record Offline Sale" to start logging exhibition transactions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-4">Time &amp; Notes</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items Sold</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4 text-right">Realized Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOfflineOrders.map((order) => {
                  const finalPaid = Number(order.final_payable || 0);
                  const orderCogs =
                    order.total_order_cost !== undefined
                      ? Number(order.total_order_cost)
                      : (order.items || []).reduce(
                          (sum, item) => sum + Number(item.cost_price || 0) * Number(item.quantity || 1),
                          0
                        );
                  const netProfit = finalPaid - orderCogs;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-themeText-primary">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </div>
                        {order.offline_notes && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 inline-block mt-0.5">
                            {order.offline_notes}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-themeText-primary">
                          {order.customer_name || 'Walk-in'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {order.customer_phone || 'No phone'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="text-[11px] truncate text-gray-700">
                              {it.quantity}x {it.title || 'Handmade Tote'}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">
                          {order.payment_method || 'UPI'}
                        </span>
                      </td>

                      <td className="p-4 font-extrabold text-themeText-primary">
                        ₹{finalPaid.toLocaleString()}
                      </td>

                      <td className="p-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono ${
                            netProfit >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick POS Drawer Component */}
      <QuickPosModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        products={products}
        onSaleComplete={() => {
          fetchRevenueData();
          if (onRefresh) onRefresh();
        }}
      />

    </div>
  );
}