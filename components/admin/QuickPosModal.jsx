// components/admin/QuickPosModal.jsx
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { STORE_INFO } from '@/lib/data';

export default function QuickPosModal({ isOpen, onClose, products = [], onSaleComplete }) {
  // Current sale items state: { [variantId]: { product, variant, quantity, customUnitPrice } }
  const [saleTray, setSaleTray] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CASH' | 'CARD'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [offlineNotes, setOfflineNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Filter only published and in-stock bags
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      const primaryVariant = p.variants?.[0] || {};
      const stock = Number(primaryVariant.stock_quantity ?? 0);
      return p.is_active && stock > 0;
    });
  }, [products]);

  // Handle tap-to-add with haptic feedback
  const handleItemTap = (product) => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(20);
    }

    const variant = product.variants?.[0] || {};
    const variantId = variant.id;
    if (!variantId) return;

    const currentStock = Number(variant.stock_quantity || 0);

    setSaleTray((prev) => {
      const existing = prev[variantId];
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty >= currentStock) return prev; // Do not exceed live stock

      return {
        ...prev,
        [variantId]: {
          product,
          variant,
          quantity: currentQty + 1,
          customUnitPrice: existing ? existing.customUnitPrice : Number(variant.offer_price || 0),
        },
      };
    });
  };

  const updateQuantity = (variantId, delta) => {
    setSaleTray((prev) => {
      const existing = prev[variantId];
      if (!existing) return prev;

      const newQty = existing.quantity + delta;
      const stock = Number(existing.variant.stock_quantity || 0);

      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[variantId];
        return copy;
      }

      if (newQty > stock) return prev;

      return {
        ...prev,
        [variantId]: { ...existing, quantity: newQty },
      };
    });
  };

  const updatePriceOverride = (variantId, newPrice) => {
    setSaleTray((prev) => {
      const existing = prev[variantId];
      if (!existing) return prev;

      return {
        ...prev,
        [variantId]: {
          ...existing,
          customUnitPrice: Number(newPrice) || 0,
        },
      };
    });
  };

  // Live Cart Calculations
  const trayItems = Object.values(saleTray);
  const totalAmount = trayItems.reduce(
    (sum, item) => sum + Number(item.customUnitPrice) * item.quantity,
    0
  );
  const totalItemsCount = trayItems.reduce((sum, item) => sum + item.quantity, 0);

  // Complete Offline Sale API submission
  const handleCompleteSale = async () => {
    if (trayItems.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || null,
        paymentMethod,
        offlineNotes: offlineNotes.trim() || null,
        items: trayItems.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
          customUnitPrice: item.customUnitPrice,
        })),
      };

      const res = await fetch('/api/admin/orders/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete offline sale');
      }

      // Success animation trigger
      setSuccessData(data);
      if (onSaleComplete) onSaleComplete();

      // Reset state for next customer within 900ms
      setTimeout(() => {
        setSaleTray({});
        setCustomerName('');
        setCustomerPhone('');
        setOfflineNotes('');
        setSuccessData(null);
        setSubmitting(false);
      }, 900);
    } catch (err) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-themeBg-canvas w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-black/10 overflow-hidden relative">
        
        {/* Instant Sale Completion Splash Overlay */}
        {successData && (
          <div className="absolute inset-0 z-50 bg-[#2D3748] text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-black mb-3 shadow-lg">
              ✓
            </div>
            <h3 className="text-xl font-black tracking-tight">Sale Recorded!</h3>
            <p className="text-xs text-gray-300 mt-1">
              Collected: ₹{Number(successData.finalPayable || totalAmount).toLocaleString()} via {paymentMethod}
            </p>
            {successData.profit !== undefined && (
              <span className="mt-3 px-3 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold rounded-full">
                Realized Net Profit: +₹{Number(successData.profit).toLocaleString()}
              </span>
            )}
            <p className="text-[10px] text-gray-400 mt-4 animate-pulse">
              Resetting POS register for next customer...
            </p>
          </div>
        )}

        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-black/[0.06] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base">🏪</span>
              <h2 className="text-sm sm:text-base font-black text-themeText-primary">
                Quick POS Register
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                Exhibition Mode
              </span>
            </div>
            <p className="text-[11px] text-themeText-secondary mt-0.5">
              Tap bags to add, adjust price/qty, and record cash/UPI transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-themeBg-surface hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Section 1: Tap-to-Add Fast Catalog Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Select Available Bags ({availableProducts.length})
              </span>
              <span className="text-[10px] text-gray-400">Tap to add to tray</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {availableProducts.map((product) => {
                const variant = product.variants?.[0] || {};
                const stock = Number(variant.stock_quantity ?? 0);
                const offerPrice = Number(variant.offer_price ?? 0);
                const inTray = saleTray[variant.id];
                const heroImg = product.images?.[0]?.image_url || '/placeholder.png';

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleItemTap(product)}
                    className={`relative p-2 rounded-theme-md text-left border transition-all active:scale-95 flex flex-col justify-between ${
                      inTray
                        ? 'bg-amber-50/70 border-themePrimary ring-2 ring-themePrimary/20'
                        : 'bg-white border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    {/* Badge showing current count in tray */}
                    {inTray && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-themePrimary text-white rounded-full text-[10px] font-black flex items-center justify-center shadow">
                        {inTray.quantity}
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={heroImg} alt={product.title} fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-bold text-themeText-primary truncate">
                          {product.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 block font-mono">
                          {stock} in stock
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs font-black text-themeText-primary">
                      ₹{offerPrice.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Active Sale Tray (Quantity Stepper & Price Override) */}
          <div className="bg-white rounded-theme-xl p-4 border border-black/5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-themeText-secondary">
                Current Sale Items ({totalItemsCount})
              </span>
              {trayItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSaleTray({})}
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  Clear Tray
                </button>
              )}
            </div>

            {trayItems.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                No bags added yet. Tap items from the catalog grid above.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {trayItems.map(({ product, variant, quantity, customUnitPrice }) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 border border-black/[0.04] gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-themeText-primary truncate">
                        {product.title}
                      </p>
                      <span className="text-[10px] text-gray-400 block">
                        Base: ₹{variant.offer_price} · Cost: ₹{variant.cost_price || 0}
                      </span>
                    </div>

                    {/* Price Override Input (Prevents Mobile Zoom) */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={customUnitPrice}
                        onChange={(e) => updatePriceOverride(variant.id, e.target.value)}
                        className="w-16 h-8 text-base sm:text-xs text-center border rounded-lg bg-white font-mono font-bold focus:ring-1 focus:ring-black"
                        title="Direct price override for this item"
                      />
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-1 bg-white border rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(variant.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100 rounded"
                      >
                        −
                      </button>
                      <span className="text-xs font-black px-1.5 min-w-[1.2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(variant.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Payment Mode Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Payment Mode *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'UPI', label: '📱 UPI / QR', color: 'bg-emerald-600 text-white' },
                { id: 'CASH', label: '💵 Cash', color: 'bg-amber-600 text-white' },
                { id: 'CARD', label: '💳 Card Swipe', color: 'bg-indigo-600 text-white' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPaymentMethod(mode.id)}
                  className={`py-2.5 px-3 rounded-theme-md text-xs font-bold transition-all active:scale-95 border ${
                    paymentMethod === mode.id
                      ? `${mode.color} border-transparent shadow-md`
                      : 'bg-white text-gray-700 border-black/10 hover:bg-gray-50'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Optional Customer Details & Event Notes */}
          <div className="bg-white rounded-theme-xl p-3.5 border border-black/5 space-y-2.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Customer Info &amp; Notes (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name (e.g. Maya)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 text-base sm:text-xs border rounded-lg bg-gray-50/50"
              />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit Phone (for rewards/receipt)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-10 px-3 text-base sm:text-xs border rounded-lg bg-gray-50/50"
              />
            </div>
            <input
              type="text"
              placeholder="Sale notes (e.g. Kochi Flea Market Stall #4, repeat visitor)"
              value={offlineNotes}
              onChange={(e) => setOfflineNotes(e.target.value)}
              className="w-full h-10 px-3 text-base sm:text-xs border rounded-lg bg-gray-50/50"
            />
          </div>

        </div>

        {/* Sticky Bottom Bar (Safe Area Padding on Mobile) */}
        <div className="p-4 bg-white border-t border-black/10 flex-shrink-0 shadow-lg space-y-2 pb-safe">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Total Billable:</span>
            <span className="text-lg font-black text-themeText-primary">
              ₹{totalAmount.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            disabled={trayItems.length === 0 || submitting}
            onClick={handleCompleteSale}
            className="w-full h-12 bg-themePrimary hover:bg-black text-white text-sm font-black rounded-theme-md shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span>Recording Transaction...</span>
            ) : (
              <span>Complete Sale (₹{totalAmount.toLocaleString()})</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}