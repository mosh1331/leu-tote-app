// app/checkout/success/page.jsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { STORE_INFO } from '@/lib/data';

// 1. Child Component: Safely consumes useSearchParams
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
      })
      .catch((err) => console.error('Error fetching order details:', err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-xs font-bold text-gray-500">
        Generating order confirmation &amp; invoice...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h1 className="text-lg font-bold text-themeText-primary">Order Not Found</h1>
        <p className="text-xs text-themeText-secondary">
          We could not locate this order. Please verify your link or check your email/WhatsApp confirmation.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-themePrimary text-white rounded-theme-md text-xs font-semibold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      {/* Top Success Badge (Screen Only) */}
      <div className="print:hidden bg-white p-6 rounded-theme-xl border border-black/[0.06] shadow-sm text-center space-y-3">
        <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-xl font-black">
          ✓
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-themeText-primary">
          Thank you for your order!
        </h1>
        <p className="text-xs text-themeText-secondary max-w-md mx-auto">
          Your handcrafted bag is reserved. Confirmation and tracking updates will be sent to{' '}
          <strong>{order.phone}</strong>.
        </p>

        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-theme-md bg-themeBg-surface hover:bg-gray-200 border text-xs font-bold text-themeText-primary flex items-center space-x-1.5"
          >
            <span>🖨️</span>
            <span>Print Tax Invoice</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-theme-md bg-themePrimary text-white text-xs font-bold"
          >
            Back to Catalog
          </Link>
        </div>
      </div>

      {/* Guest Points Unlock Callout (Screen Only) */}
      {!order.is_registered && (
        <div className="print:hidden bg-amber-50 border border-amber-200 p-5 rounded-theme-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <span>🎁</span>
            <span>{order.points_earned} Leu Points Locked!</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Because you completed your purchase as a guest using <strong>{order.phone}</strong>, your {order.points_earned} points are waiting! Sign up with this phone number to convert them into real discounts on your next bag.
          </p>
          <Link
            href="/rewards"
            className="inline-block mt-1 text-xs font-bold text-amber-950 underline underline-offset-2"
          >
            Activate Account &amp; Unlock Points →
          </Link>
        </div>
      )}

      {/* Printable Tax Invoice Container */}
      <div className="bg-white p-6 sm:p-10 rounded-theme-xl border border-black/[0.08] shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h2 className="text-2xl font-black text-themeText-primary tracking-tight">
              {STORE_INFO.name}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">Studio Handcrafted Bags</p>
            <p className="text-[10px] text-gray-400 mt-1">GSTIN: 29AAAAA0000A1Z5 · Bengaluru, India</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tax Invoice</span>
            <p className="text-sm font-black text-gray-800 mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-[10px] text-gray-400">Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase">
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px] block mb-1">Billed &amp; Shipped To</span>
            <p className="font-bold text-gray-800">{order.recipient_name || order.full_name}</p>
            <p className="text-gray-600">{order.address_line1}</p>
            {order.address_line2 && <p className="text-gray-600">{order.address_line2}</p>}
            <p className="text-gray-600">
              {order.city}, {order.state} - {order.postal_code}
            </p>
            <p className="text-gray-500 mt-1">Phone: {order.phone}</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-gray-400 uppercase text-[10px] block mb-1">Payment Method</span>
            <p className="text-gray-700 font-semibold">UPI / Online Gateway</p>
            <p className="text-gray-400 text-[10px]">Currency: INR (₹)</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-t pt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 uppercase text-[10px]">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-3">
                    <span className="font-bold text-gray-800">{item.title}</span>
                    <span className="text-[10px] text-gray-400 block">
                      Size: {item.size || 'Standard'} {item.color ? `· Color: ${item.color}` : ''}
                    </span>
                  </td>
                  <td className="py-3 text-center text-gray-600 font-semibold">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">₹{Number(item.unit_price).toLocaleString()}</td>
                  <td className="py-3 text-right font-bold text-gray-800">
                    ₹{Number(item.total_price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Calculation */}
        <div className="border-t pt-4 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Items Subtotal:</span>
              <span>₹{Number(order.subtotal).toLocaleString()}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Points Discount:</span>
                <span>-₹{Number(order.discount_amount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Delivery:</span>
              <span className="text-green-600 font-semibold">FREE</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-black text-sm text-gray-900">
              <span>Total Amount Paid:</span>
              <span>₹{Number(order.final_payable).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Notice */}
        <div className="border-t pt-4 text-[10px] text-gray-400 text-center space-y-1">
          <p>This is a computer-generated tax invoice for your handcrafted Leu Tote order.</p>
          <p>For questions or support, reach out to support@leutote.com or contact us on WhatsApp.</p>
        </div>

      </div>
    </main>
  );
}

// 2. Main Page Component: Encloses content in Suspense to prevent CSR bailout
export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-themeBg-canvas pb-20">
      <div className="print:hidden">
        <Header showBack={false} />
      </div>

      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center p-6 text-xs font-bold text-gray-500">
            Loading confirmation details...
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}