// app/orders/[id]/page.jsx
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { STORE_INFO } from '@/lib/data';

const STATUS_STEPS = ['PAID', 'SHIPPED', 'DELIVERED'];

export default function PublicOrderInvoicePage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order not found');
        setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-themeBg-canvas flex items-center justify-center p-6">
        <div className="text-xs font-bold text-themeText-secondary animate-pulse">
          Loading Order Invoice...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-themeBg-canvas flex items-center justify-center p-4">
        <div className="bg-themeBg-card max-w-md w-full rounded-theme-xl p-8 text-center border border-black/5 shadow-sm space-y-4">
          <div className="text-3xl">🔍</div>
          <h1 className="text-lg font-black text-themeText-primary">Order Not Found</h1>
          <p className="text-xs text-themeText-secondary leading-relaxed">
            This invoice link may be incomplete or expired. Please check the link sent to your WhatsApp or email.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-themePrimary text-white text-xs font-bold rounded-theme-md"
          >
            Back to {STORE_INFO.name}
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = (order.status || 'PENDING').toUpperCase();
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'RETURNED';
  const activeStepIndex = STATUS_STEPS.indexOf(
    currentStatus === 'PACKED' ? 'PAID' : currentStatus
  );

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_charge || 0);
  const finalPayable = Number(order.final_payable || 0);

  return (
    <div className="min-h-screen bg-themeBg-canvas text-themeText-primary py-6 px-4 sm:py-10 sm:px-6 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Top Action Bar (Hidden on Print) */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/"
            className="text-xs font-bold text-themeText-secondary hover:text-themeText-primary flex items-center space-x-1"
          >
            <span>←</span>
            <span>Continue Shopping</span>
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-themeText-primary border border-black/10 rounded-theme-md text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <span>🖨️</span>
            <span>Download / Print Invoice</span>
          </button>
        </div>

        {/* Guest Points Claim Banner (Only if Guest & Points > 0) */}
        {!order.is_registered && Number(order.points_earned) > 0 && !isCancelled && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-theme-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-start space-x-3">
              <span className="text-xl mt-0.5">🎁</span>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-amber-950">
                  You earned {order.points_earned} Leu Points (₹{order.points_earned} value)!
                </h2>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Create a free account with your phone number to unlock these points for your next bag.
                </p>
              </div>
            </div>
            <Link
              href={`/account?claimOrder=${order.id}`}
              className="px-4 py-2 bg-amber-900 hover:bg-black text-white text-xs font-bold rounded-theme-md text-center whitespace-nowrap shadow-sm"
            >
              Claim Points
            </Link>
          </div>
        )}

        {/* Main Invoice Sheet */}
        <div className="bg-themeBg-card rounded-theme-xl border border-black/[0.06] shadow-sm overflow-hidden print:shadow-none print:border-gray-200">
          
          {/* Brand & Invoice Header */}
          <div className="p-6 sm:p-8 border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-xl font-black tracking-tight text-themeText-primary block">
                {STORE_INFO.name}
              </span>
              <span className="text-[11px] text-themeText-secondary">
                Studio Handcrafted Bags · Kerala, India
              </span>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-themeText-secondary">
                  Tax Invoice / Receipt
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isCancelled
                      ? 'bg-red-100 text-red-800'
                      : currentStatus === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-themeText-primary">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[11px] text-themeText-secondary">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Order Progress Stepper (Screen Only) */}
          {!isCancelled && (
            <div className="px-6 py-4 bg-themeBg-surface/60 border-b border-black/[0.05] print:hidden">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = activeStepIndex >= index;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                            isCompleted
                              ? 'bg-themePrimary text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span
                          className={`text-[10px] font-bold mt-1 ${
                            isCompleted ? 'text-themeText-primary' : 'text-gray-400'
                          }`}
                        >
                          {step === 'PAID' ? 'Confirmed' : step === 'SHIPPED' ? 'Dispatched' : 'Delivered'}
                        </span>
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 mb-4 ${
                            activeStepIndex > index ? 'bg-themePrimary' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Shipment Tracking Banner (Shown Once Dispatched) */}
          {order.tracking_id && (
            <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-theme-md bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block">
                  Shipment Dispatched via {order.courier_name || 'Courier'}
                </span>
                <p className="text-xs font-mono font-bold text-blue-950 mt-0.5">
                  Tracking ID: {order.tracking_id}
                </p>
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-theme-sm text-center print:hidden"
                >
                  Track Package ↗
                </a>
              )}
            </div>
          )}

          {/* Billed To & Shipping Address */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-black/[0.06] text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-themeText-secondary block">
                Billed To
              </span>
              <p className="font-bold text-sm text-themeText-primary">
                {order.full_name || 'Valued Customer'}
              </p>
              <p className="text-themeText-secondary">Phone: {order.phone}</p>
              <p className="text-themeText-secondary">
                Payment Status:{' '}
                <strong className="text-themeText-primary">{order.payment_status}</strong>
              </p>
              {order.payment_transaction_id && (
                <p className="text-[10px] font-mono text-gray-400">
                  Txn Ref: {order.payment_transaction_id}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-themeText-secondary block">
                Shipping Address
              </span>
              {order.address_line1 ? (
                <>
                  <p className="font-bold text-sm text-themeText-primary">
                    {order.recipient_name || order.full_name}
                  </p>
                  <p className="text-themeText-secondary">{order.address_line1}</p>
                  {order.address_line2 && (
                    <p className="text-themeText-secondary">{order.address_line2}</p>
                  )}
                  {order.landmark && (
                    <p className="text-gray-400">Landmark: {order.landmark}</p>
                  )}
                  <p className="font-semibold text-themeText-primary">
                    {order.city}, {order.state} - {order.postal_code}
                  </p>
                </>
              ) : (
                <p className="text-themeText-secondary">Direct Studio / In-Person Pickup</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 sm:p-8 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-themeText-secondary">
              Order Items
            </h3>

            <div className="divide-y divide-black/[0.06]">
              {order.items?.map((item) => (
                <div
                  key={item.item_id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {item.image_url && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-black/5 print:hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-themeText-primary truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-themeText-secondary">
                        {item.size || 'Standard'}
                        {item.color ? ` · ${item.color}` : ''} · Qty: {item.quantity} × ₹
                        {Number(item.unit_price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-extrabold text-themeText-primary whitespace-nowrap">
                    ₹{Number(item.total_price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="pt-5 border-t border-black/[0.08] flex justify-end">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-themeText-secondary">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-themeText-primary">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Points / Offer Discount</span>
                    <span className="font-bold">-₹{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-themeText-secondary">
                  <span>
                    Shipping ({order.state ? order.state : 'Standard'})
                  </span>
                  <span className="font-semibold text-themeText-primary">
                    {shipping > 0 ? `₹${shipping.toLocaleString()}` : 'Free'}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-black/10 flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase text-themeText-primary">
                    Total Paid
                  </span>
                  <span className="text-lg font-black text-themeText-primary">
                    ₹{finalPayable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="px-6 py-4 bg-themeBg-surface/50 border-t border-black/[0.05] text-center text-[11px] text-themeText-secondary">
            Thank you for supporting handcrafted slow fashion with {STORE_INFO.name}. For queries, reach out via WhatsApp or Instagram (@leu.tote).
          </div>

        </div>
      </div>
    </div>
  );
}