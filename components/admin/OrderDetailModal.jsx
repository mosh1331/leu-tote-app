// components/admin/OrderDetailModal.jsx
'use client';

import { useState } from 'react';
import OrderFinancialBreakdown from './order-modal/OrderFinancialBreakdown';
import OrderFulfillmentSection from './order-modal/OrderFulfillmentSection';
import OrderCustomerDetails from './order-modal/OrderCustomerDetails';
import OrderItemsTable from './order-modal/OrderItemsTable';

export default function OrderDetailModal({ order, onClose, onRefresh }) {
  if (!order) return null;

  const currentStatus = (order.status || 'PENDING').toUpperCase();
  const [status, setStatus] = useState(currentStatus);

  // Delivery partner state (defaults to 'India Post' and its tracking URL)
  const [courierName, setCourierName] = useState(order.courier_name || 'India Post');
  const [trackingId, setTrackingId] = useState(order.tracking_id || '');
  const [trackingUrl, setTrackingUrl] = useState(
    order.tracking_url || 'https://www.indiapost.gov.in/'
  );

  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // 1. Financial Computations
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount_amount || 0);
  const collectedShipping = Number(order.shipping_charge || 0);
  const finalPayable = Number(order.final_payable || 0);

  const totalCogs = Number(
    order.total_order_cost !== undefined
      ? order.total_order_cost
      : (order.items || []).reduce(
          (sum, it) => sum + Number(it.cost_price || 0) * Number(it.quantity || 1),
          0
        )
  );

  const isOffline = (order.channel || '').toUpperCase() === 'OFFLINE';
  console.log(order,'order')
  const courierCost = isOffline
    ? 0
    : (order.state || '').trim().toLowerCase() === 'kerala'
    ? 69
    : 99;

  // Razorpay Fee: 2% fee + 18% GST on the fee = 2.36% of customer payment (₹0 for offline)
  const rzpFee = isOffline ? 0 : Number((finalPayable * 0.02 * 1.18).toFixed(2));
  const totalExpenses = totalCogs + courierCost + rzpFee;
  const netMargin = Number((finalPayable - totalExpenses).toFixed(2));
  const marginPercent =
    finalPayable > 0 ? Math.round((netMargin / finalPayable) * 100) : 0;

  // 2. Allowed Status Transitions
  // PENDING -> PAID, CANCELLED
  // PAID -> SHIPPED, CANCELLED
  const getAvailableStatusOptions = () => {
    if (status === 'PENDING') {
      return [
        { value: 'PENDING', label: 'PENDING (Current)' },
        { value: 'PAID', label: 'Mark as PAID' },
        { value: 'CANCELLED', label: 'Mark as CANCELLED' },
      ];
    }
    if (status === 'PAID') {
      return [
        { value: 'PAID', label: 'PAID (Current)' },
        { value: 'SHIPPED', label: 'Mark as SHIPPED' },
        { value: 'CANCELLED', label: 'Mark as CANCELLED' },
      ];
    }
    if (status === 'SHIPPED') {
      return [
        { value: 'SHIPPED', label: 'SHIPPED (In Transit)' },
        { value: 'DELIVERED', label: 'Mark as DELIVERED' },
        { value: 'RETURNED', label: 'Mark as RETURNED' },
      ];
    }
    return [{ value: status, label: status }];
  };

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === status) return;

    if (newStatus === 'SHIPPED' && !trackingId.trim() && !isOffline) {
      alert('Please enter a Tracking ID / AWB before marking the order as SHIPPED.');
      return;
    }

    setUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
          courierName: isOffline ? null : courierName.trim(),
          trackingId: isOffline ? null : trackingId.trim(),
          trackingUrl: isOffline ? null : trackingUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      setStatus(newStatus);

      if (newStatus === 'SHIPPED' && !isOffline) {
        if (data.whatsapp?.success) {
          setFeedback({
            type: 'success',
            message: '✓ Order marked as SHIPPED and WhatsApp tracking alert sent!',
          });
        } else {
          setFeedback({
            type: 'error',
            message: `Order status set to SHIPPED, but WhatsApp failed: ${
              data.whatsapp?.error || 'Check server logs'
            }`,
          });
        }
      } else {
        setFeedback({
          type: 'success',
          message: `✓ Status updated to ${newStatus}`,
        });
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-themeBg-canvas w-full max-w-4xl rounded-theme-xl border border-black/10 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:m-0">
        
        {/* Header */}
        <div className="bg-[#2D3748] text-white px-5 py-4 flex items-center justify-between flex-shrink-0 print:hidden">
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
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono font-bold">
                  {status}
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

          <div className="flex items-center space-x-3">
            {/* Context-Aware Status Dropdown */}
            <select
              disabled={updating}
              value={status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="h-8 px-2.5 text-xs font-bold border rounded-lg bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
            >
              {getAvailableStatusOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-themeText-primary">
          {feedback && (
            <div
              className={`p-3 rounded-theme-md text-xs font-bold flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. All-Expenses Profitability Ledger */}
          <OrderFinancialBreakdown
            subtotal={subtotal}
            discount={discount}
            collectedShipping={collectedShipping}
            finalPayable={finalPayable}
            totalCogs={totalCogs}
            courierCost={courierCost}
            rzpFee={rzpFee}
            netMargin={netMargin}
            marginPercent={marginPercent}
            isOffline={isOffline}
          />

          {/* 2. Dispatch Section (When order is PAID and awaiting courier) */}
          {!isOffline && status === 'PAID' && (
            <OrderFulfillmentSection
              courierName={courierName}
              setCourierName={setCourierName}
              trackingId={trackingId}
              setTrackingId={setTrackingId}
              trackingUrl={trackingUrl}
              setTrackingUrl={setTrackingUrl}
              onDispatch={() => handleUpdateStatus('SHIPPED')}
              updating={updating}
              existingTrackingId={order.tracking_id}
            />
          )}

          {/* 3. Customer & Address Details */}
          <OrderCustomerDetails order={order} isOffline={isOffline} />

          {/* 4. Purchased Products List */}
          <OrderItemsTable items={order.items || []} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-black/5 flex items-center justify-between flex-shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 border rounded-theme-md text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <span>🖨️</span>
            <span>Print Tax Invoice</span>
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