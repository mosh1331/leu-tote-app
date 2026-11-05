// app/checkout/page.jsx
'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import { checkoutSchema } from '@/lib/validationSchemas';
import { STORE_INFO } from '@/lib/data';
import { INDIAN_STATES, calculateShippingCharge } from '@/lib/constants';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [pointsApplied, setPointsApplied] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      state: 'Kerala', // Default selection
      redeemPoints: 0,
    },
  });

  // Watch state field to compute dynamic shipping charge
  const selectedState = watch('state');
  const shippingCharge = calculateShippingCharge(selectedState);

  // 20% point redemption ceiling based on cartSubtotal
  const maxAllowedPointsDiscount = Math.floor(cartSubtotal * 0.20);
  const finalPayable = Math.max(cartSubtotal + shippingCharge - pointsApplied, 1);

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
      const orderPayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        shippingCharge,
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

      // Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: Math.round(amountToPay * 100), // in paise
        currency: 'INR',
        name: STORE_INFO.name,
        description: `Order #${orderId.slice(0, 8)}`,
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: formData.email || '',
        },
        theme: {
          color: '#2D3748',
        },
        handler: async function (response) {
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
            clearCart();
            router.push(`/checkout/success?orderId=${orderId}&status=pending`);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}`);
      }
    } catch (err) {
      alert(err.message || 'Error occurred while processing checkout');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-themeBg-canvas pb-20">
        <Header showBack={true} />
        <main className="max-w-md mx-auto px-4 pt-16 text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm border border-black/[0.06]">
            👜
          </div>
          <h1 className="text-xl font-black text-themeText-primary">Your Cart is Empty</h1>
          <p className="text-xs text-themeText-secondary">
            You don't have any handcrafted bags in your bag right now.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-themePrimary hover:bg-themePrimary-hover text-white rounded-theme-md text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Explore Collection
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-themeBg-canvas pb-24 md:pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Header showBack={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <h1 className="text-xl sm:text-2xl font-black text-themeText-primary mb-6">
          Checkout &amp; Shipping
        </h1>

        {/* 
          LAYOUT ORDER: 
          On Mobile (< lg): Order Review (Cart) is order-1 (Top), Form is order-2 (Below).
          On Desktop (lg+): Form is on the Left (order-none), Order Review is on the Right.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ======================================================== */}
          {/* 1. ORDER REVIEW & CART SUMMARY (TOP on Mobile, RIGHT on Desktop) */}
          {/* ======================================================== */}
          <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-theme-xl border border-black/[0.06] shadow-sm space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b pb-3 border-black/[0.06]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
                  Your Bag ({cart.length} {cart.length === 1 ? 'Item' : 'Items'})
                </h2>
                <span className="text-[11px] text-themeAccent font-semibold">
                  Review &amp; Edit
                </span>
              </div>

              {/* Editable Cart Item List */}
              <div className="space-y-3.5 max-h-80 overflow-y-auto divide-y divide-black/[0.04]">
                {cart.map((item) => (
                  <div key={item.variantId} className="pt-3 first:pt-0 flex items-center space-x-3">
                    {/* Item Thumbnail */}
                    <div className="relative w-14 h-14 rounded-theme-md overflow-hidden bg-themeBg-surface flex-shrink-0 border border-black/[0.06]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="60px"
                        className="object-cover"
                      />
                    </div>

                    {/* Title & Price */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-themeText-primary truncate">
                        {item.title}
                      </p>
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        ₹{item.unitPrice.toLocaleString()} each
                      </p>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center space-x-2 mt-1.5">
                        <div className="inline-flex items-center border border-black/10 rounded-theme-sm bg-gray-50 px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, -1)}
                            className="w-5 h-5 flex items-center justify-center text-xs font-black text-themeText-primary hover:bg-black/5 rounded"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold px-2 text-themeText-primary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.stock && item.quantity >= item.stock) return;
                              updateQuantity(item.variantId, 1);
                            }}
                            disabled={item.stock ? item.quantity >= item.stock : false}
                            className="w-5 h-5 flex items-center justify-center text-xs font-black text-themeText-primary hover:bg-black/5 rounded disabled:opacity-30 disabled:pointer-events-none"
                            title={item.stock && item.quantity >= item.stock ? 'Max stock reached' : 'Increase quantity'}
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-[11px] text-red-500 hover:text-red-700 font-semibold px-1 py-0.5"
                          title="Remove from cart"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Line Total */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-themeText-primary">
                        {STORE_INFO.currency}{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="border-t border-black/[0.06] pt-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Bag Subtotal</span>
                  <span>{STORE_INFO.currency}{cartSubtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                  <span>Shipping ({selectedState || 'Standard'})</span>
                  <span className="font-bold text-themeText-primary">
                    ₹{shippingCharge}
                  </span>
                </div>

                {pointsApplied > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Points Redeemed</span>
                    <span>-{STORE_INFO.currency}{pointsApplied.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-black/[0.06] pt-2 flex justify-between text-sm sm:text-base font-black text-themeText-primary">
                  <span>Final Total</span>
                  <span>{STORE_INFO.currency}{finalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Rewards Points Banner */}
              <div className="p-3 rounded-theme-md bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center space-x-2">
                <span className="text-base">🎁</span>
                <span>
                  Earn <strong>{Math.round(finalPayable * 0.05)} Leu Points</strong> on this order!
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. SHIPPING & CONTACT FORM (BOTTOM on Mobile, LEFT on Desktop) */}
          {/* ======================================================== */}
          <form
            onSubmit={handleSubmit(onCheckoutSubmit)}
            className="order-2 lg:order-1 lg:col-span-7 space-y-6"
          >
            {/* Step 1: Contact Information */}
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
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Mobile Phone * (For WhatsApp updates &amp; points)</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="10-digit mobile number"
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

            {/* Step 2: Delivery Address & State Selection */}
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

                {/* State Dropdown */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">State *</label>
                  <select
                    {...register('state')}
                    className="w-full p-2.5 text-xs rounded-theme-md border bg-white focus:border-themePrimary focus:outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
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

            {/* Submit / Pay CTA Button */}
            <button
              type="submit"
              disabled={submitting || !cart.length}
              className="w-full py-4 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Connecting Payment...' : `Pay ₹${finalPayable.toLocaleString()} via UPI / Card`}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}