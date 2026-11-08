// components/admin/OrderDetailModal.jsx
'use client';

import { useState } from 'react';
import { STORE_INFO } from '@/lib/data';

export default function OrderDetailModal({ order, onClose, onRefresh }) {
  if (!order) return null;

  const [status, setStatus] = useState(order.status || 'PENDING');
  const [updating, setUpdating] = useState(false);

  // Financial figures
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount_amount || 0);
  const collectedShipping = Number(order.shipping_charge || 0);
  const finalPayable = Number(order.final_payable || 0);

  // Cost calculation
  const totalCogs = Number(
    order.total_order_cost !== undefined
      ? order.total_order_cost
      : (order.items || []).reduce(
          (sum, it) => sum + Number(it.cost_price || 0) * Number(it.quantity || 1),
          0
        )
  );

  // Actual Courier Expense Rule:
  // For Kerala = ₹69, other Indian states = ₹99, and Offline sales = ₹0
  const isOffline = (order.channel || '').toUpperCase() === 'OFFLINE';
  const courierCost = isOffline
    ? 0
    : (order.state || '').trim().toLowerCase() === 'kerala'
    ? 69
    : 99;

  // Realized Net Profit
  const netProfit = finalPayable - totalCogs - courierCost;
  const marginPercent =
    finalPayable > 0 ? Math.round((netProfit / finalPayable) * 100) : 0;

  // Status Change Handler
  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setStatus(newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-themeBg-canvas w-full max-w-4xl rounded-theme-xl border border-black/10 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* 1. Header Bar */}
        <div className="bg-[#2D3748] text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📦</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </h2>
                <span
                  className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                    isOffline ? 'bg-emerald-500 text-black' : 'bg-blue-500 text-white'
                  }`}
                >
                  {isOffline ? 'Offline / Pop-up' : 'Online Store'}
                </span>
              </div>
              <p className="text-[10px] text-gray-300 font-mono mt-0.5">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
            aria-label="Close details"
          >
            ✕
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Top Profit & Financial KPI Banner */}
          <div
            className={`p-4 sm:p-5 rounded-theme-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              netProfit >= 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-red-50/80 border-red-200 text-red-950'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 block">
                Profitability Health
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                <span className="text-xs sm:text-sm font-bold text-gray-600 ml-2">
                  ({marginPercent}% margin)
                </span>
              </div>
            </div>

            {/* Quick Status Pill / Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700">Order Status:</span>
              <select
                disabled={updating}
                value={status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="h-9 px-3 text-xs font-bold border rounded-theme-sm bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="PACKED">PACKED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED (Reverse Points)</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </div>
          </div>

          {/* Detailed Financial & Cost Equations */}
          <div className="bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
              Revenue, Cost &amp; Shipping Formula
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Subtotal</span>
                <span className="text-sm font-extrabold text-themeText-primary">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
                <span className="text-[10px] text-red-500 font-bold block uppercase">Discounts / Points</span>
                <span className="text-sm font-extrabold text-red-600">
                  -₹{discount.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
                <span className="text-[10px] text-gray-500 font-bold block uppercase">
                  Shipping Fee Paid
                </span>
                <span className="text-sm font-extrabold text-themeText-primary">
                  +₹{collectedShipping.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
                <span className="text-[10px] text-indigo-700 font-bold block uppercase">Final Paid</span>
                <span className="text-sm font-extrabold text-indigo-900">
                  ₹{finalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="p-3.5 bg-gray-900 text-white rounded-theme-sm font-mono text-[11px] sm:text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span>Revenue: <strong>₹{finalPayable.toLocaleString()}</strong></span>
                <span className="text-amber-400">Total COGS: -₹{totalCogs.toLocaleString()}</span>
                <span className="text-blue-300">Courier Cost: -₹{courierCost.toLocaleString()}</span>
              </div>
              <div className="font-bold text-emerald-400">
                = Net Realized Margin: {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Two-Column Details Grid: Customer & Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Customer Information */}
            <div className="bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary border-b pb-2">
                Customer Profile
              </h3>
              <div className="text-xs space-y-1">
                <p className="font-bold text-themeText-primary text-sm">
                  {order.customer_name || 'Guest Customer'}
                </p>
                <p className="text-gray-500">Phone: {order.customer_phone || '—'}</p>
                {order.customer_email && (
                  <p className="text-gray-500">Email: {order.customer_email}</p>
                )}
                <div className="pt-2 flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.is_registered
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.is_registered ? 'Registered Member' : 'Guest Buyer'}
                  </span>
                  {order.points_earned > 0 && (
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                      +{order.points_earned} pts reward
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary border-b pb-2">
                Delivery Address
              </h3>
              {isOffline ? (
                <div className="text-xs text-gray-500 py-3 space-y-1">
                  <p className="font-bold text-gray-800">Direct In-Person Fulfillment</p>
                  <p>No courier transit required.</p>
                  {order.offline_notes && (
                    <p className="p-2 bg-amber-50 rounded text-amber-800 text-[11px] mt-2">
                      Notes: {order.offline_notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs space-y-1 text-gray-600">
                  <p className="font-bold text-themeText-primary text-sm">
                    {order.recipient_name || order.customer_name}
                  </p>
                  <p>{order.address_line1}</p>
                  {order.address_line2 && <p>{order.address_line2}</p>}
                  {order.landmark && <p className="text-gray-400">Landmark: {order.landmark}</p>}
                  <p className="font-semibold text-gray-800">
                    {order.city}, {order.state} - {order.postal_code}
                  </p>
                  {order.delivery_phone && (
                    <p className="text-gray-400 text-[11px] pt-1">
                      Contact: {order.delivery_phone}
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Line Items Table with Unit Profit Breakdown */}
          <div className="bg-white rounded-theme-lg border border-black/5 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
                Purchased Bags ({order.items?.length || 0})
              </h3>
              <span className="text-[11px] text-gray-400">Unit Cost &amp; Margin Breakdown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Bag Title</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5 text-right">Offer Price</th>
                    <th className="p-3.5 text-right">Unit Cost</th>
                    <th className="p-3.5 text-right">Line Total</th>
                    <th className="p-3.5 text-right">Item Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item, idx) => {
                    const unitPrice = Number(item.unit_price || 0);
                    const unitCost = Number(item.cost_price || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = Number(item.total_price || unitPrice * qty);
                    const itemProfit = (unitPrice - unitCost) * qty;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-3.5">
                          <p className="font-bold text-themeText-primary">{item.title}</p>
                          <span className="text-[10px] text-gray-400">
                            {item.size || 'Standard'} {item.color ? `· ${item.color}` : ''}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-gray-700">{qty}</td>
                        <td className="p-3.5 text-right font-mono text-gray-600">
                          ₹{unitPrice.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-mono text-amber-700">
                          ₹{unitCost.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-themeText-primary">
                          ₹{lineTotal.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              itemProfit >= 0
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {itemProfit >= 0 ? '+' : ''}₹{itemProfit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 3. Footer Action */}
        <div className="p-4 bg-white border-t border-black/5 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 border rounded-theme-md text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
          >
            🖨️ Print Receipt / Invoice
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#2D3748] hover:bg-black text-white text-xs font-bold rounded-theme-md shadow-md active:scale-95 transition-all"
          >
            Close View
          </button>
        </div>

      </div>
    </div>
  );
}