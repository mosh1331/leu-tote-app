// app/checkout/page.jsx
'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import { checkoutSchema } from '@/lib/validationSchemas';
import { STORE_INFO } from '@/lib/data';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [pointsApplied, setPointsApplied] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(checkoutSchema),
    defaultValues: { redeemPoints: 0 },
  });

  // Calculate 20% point redemption ceiling based on backend specification
  const maxAllowedPointsDiscount = Math.floor(cartSubtotal * 0.20);
  const finalPayable = Math.max(cartSubtotal - pointsApplied, 1);

  const handleApplyPoints = () => {
    const inputPoints = Number(watch('redeemPoints') || 0);
    const applicable = Math.min(inputPoints, maxAllowedPointsDiscount);
    setPointsApplied(applicable);
  };

  const onCheckoutSubmit = async (formData) => {
    if (!cart.length) {
      alert('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Call your existing Backend Route: /api/orders/create
      const orderPayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        referralCode: formData.referralCode || null,
        redeemPoints: pointsApplied,
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      const { orderId, finalPayable: amountToPay } = data;

      // 2. Open Razorpay Gateway Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: amountToPay * 100, // in paise
        currency: 'INR',
        name: STORE_INFO.name,
        description: `Order #${orderId.slice(0, 8)}`,
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=120&auto=format&fit=crop&q=80',
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: formData.email || '',
        },
        theme: {
          color: '#2D3748', // themePrimary
        },
        handler: async function (response) {
          // Verify on backend
          await fetch('/api/orders/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          clearCart();
          router.push(`/checkout/success?orderId=${orderId}`);
        },
        modal: {
          ondismiss: function () {
            // If user closes modal, order is saved in PENDING state; redirect to order tracking
            clearCart();
            router.push(`/checkout/success?orderId=${orderId}&status=pending`);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback demo redirect
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}`);
      }
    } catch (err) {
      alert(err.message || 'Error occurred while processing checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-themeBg-canvas pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Header showBack={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <h1 className="text-xl sm:text-2xl font-black text-themeText-primary mb-6">
          Checkout &amp; Shipping
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Contact & Shipping Form */}
          <form
            onSubmit={handleSubmit(onCheckoutSubmit)}
            className="lg:col-span-7 space-y-6"
          >
            {/* Step 1: Guest Contact */}
            <div className="bg-white p-5 rounded-theme-xl border border-black/[0.06] shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
                1. Contact Information
              </h2>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  {...register('fullName')}
                  placeholder="e.g. Aditi Sharma"
                  className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                />
                {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Mobile Phone (For WhatsApp delivery &amp; points) *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="10-digit phone number"
                  className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                />
                {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Email (Optional)</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@domain.com"
                  className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                />
              </div>
            </div>

            {/* Step 2: Shipping Address */}
            <div className="bg-white p-5 rounded-theme-xl border border-black/[0.06] shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
                2. Shipping Address
              </h2>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Street Address *</label>
                <input
                  {...register('addressLine1')}
                  placeholder="House/Flat No, Street, Landmark"
                  className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                />
                {errors.addressLine1 && <p className="text-[10px] text-red-500 mt-0.5">{errors.addressLine1.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">City *</label>
                  <input
                    {...register('city')}
                    placeholder="City"
                    className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                  />
                  {errors.city && <p className="text-[10px] text-red-500 mt-0.5">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">State *</label>
                  <input
                    {...register('state')}
                    placeholder="State"
                    className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                  />
                  {errors.state && <p className="text-[10px] text-red-500 mt-0.5">{errors.state.message}</p>}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">PIN Code *</label>
                <input
                  {...register('postalCode')}
                  placeholder="6-digit postal code"
                  className="w-full p-2.5 text-xs rounded-theme-md border focus:border-themePrimary focus:outline-none"
                />
                {errors.postalCode && <p className="text-[10px] text-red-500 mt-0.5">{errors.postalCode.message}</p>}
              </div>
            </div>

            {/* Step 3: Rewards & Referral Discount */}
            <div className="bg-white p-5 rounded-theme-xl border border-black/[0.06] shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
                3. Rewards &amp; Referral Codes
              </h2>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Referral Code</label>
                <input
                  {...register('referralCode')}
                  placeholder="e.g. LEU-9K2P"
                  className="w-full p-2.5 text-xs rounded-theme-md border uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Redeem Points (Max 20% cap = ₹{maxAllowedPointsDiscount})
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    {...register('redeemPoints')}
                    placeholder="0"
                    className="flex-1 p-2.5 text-xs rounded-theme-md border"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPoints}
                    className="px-4 py-2 bg-themeBg-surface hover:bg-gray-200 text-xs font-bold rounded-theme-md"
                  >
                    Apply
                  </button>
                </div>
                {pointsApplied > 0 && (
                  <p className="text-[11px] text-green-600 font-semibold mt-1">
                    ✓ Applied ₹{pointsApplied} discount from your points balance.
                  </p>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={submitting || !cart.length}
              className="w-full py-4 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Connecting Payment...' : `Pay ₹${finalPayable.toLocaleString()} via UPI / Card`}
            </button>
          </form>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-theme-xl border border-black/[0.06] shadow-sm space-y-4 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
                Order Review ({cart.length} SKUs)
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto divide-y">
                {cart.map((item) => (
                  <div key={item.variantId} className="pt-2 flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-themeText-primary">{item.title}</p>
                      <p className="text-gray-400 text-[10px]">Qty: {item.quantity} · Size: {item.size}</p>
                    </div>
                    <span className="font-bold">
                      {STORE_INFO.currency}{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Bag Subtotal</span>
                  <span>{STORE_INFO.currency}{cartSubtotal.toLocaleString()}</span>
                </div>
                {pointsApplied > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Points Redeemed</span>
                    <span>-{STORE_INFO.currency}{pointsApplied.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-black text-themeText-primary">
                  <span>Final Total</span>
                  <span>{STORE_INFO.currency}{finalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Points Earned Preview */}
              <div className="p-3 rounded-theme-md bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                🎁 You will earn <strong>{Math.round(finalPayable * 0.05)} Leu Points</strong> on this order!
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}