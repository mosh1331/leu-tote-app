// components/auth/CustomerDashboard.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { INDIAN_STATES } from '@/lib/constants';
import { STORE_INFO } from '@/lib/data';

export default function CustomerDashboard({ profileData, unlockedBanner, onRefresh, onLogout }) {
  const { user, points, addresses = [], orders = [] } = profileData;
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'points'
  const [copiedCode, setCopiedCode] = useState(false);

  // Add Address Form State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    recipient_name: user.full_name || '',
    phone: user.phone || '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: 'Kerala',
    postal_code: '',
    is_default: addresses.length === 0,
  });

  const handleCopyReferral = () => {
    if (!user.referral_code) return;
    navigator.clipboard.writeText(user.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addrForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save address');

      setShowAddAddress(false);
      setAddrForm({
        recipient_name: user.full_name || '',
        phone: user.phone || '',
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: '',
        state: 'Kerala',
        postal_code: '',
        is_default: false,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Remove this saved address?')) return;
    await fetch(`/api/auth/addresses?id=${id}`, { method: 'DELETE' });
    if (onRefresh) onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Newly Unlocked Points Celebration Banner */}
      {unlockedBanner > 0 && (
        <div className="p-4 rounded-theme-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center space-x-3">
          <span className="text-xl">🎉</span>
          <span>
            Welcome! {unlockedBanner} Leu Points (₹{unlockedBanner} value) from your previous guest orders have been unlocked!
          </span>
        </div>
      )}

      {/* Top Profile & Rewards Card */}
      <div className="bg-themeBg-card rounded-theme-xl p-5 sm:p-7 border border-black/5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Verified Member
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-themeText-primary mt-1.5">
              {user.full_name || 'Leu Tote Member'}
            </h1>
            <p className="text-xs font-mono text-themeText-secondary">+91 {user.phone}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="self-start sm:self-auto px-4 py-2 rounded-theme-md bg-themeBg-surface hover:bg-red-50 text-themeText-primary hover:text-red-700 border border-black/5 text-xs font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Points & Referral Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-theme-lg bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
              Available Leu Points
            </span>
            <div className="text-2xl font-black text-amber-950 mt-0.5">
              {points.available} <span className="text-xs font-bold">(₹{points.available})</span>
            </div>
            <span className="text-[10px] text-amber-800">Redeemable at checkout</span>
          </div>

          <div className="p-4 rounded-theme-lg bg-themeBg-surface border border-black/[0.05]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-themeText-secondary block">
              Pending / Vesting Points
            </span>
            <div className="text-2xl font-black text-themeText-primary mt-0.5">
              {points.vesting}
            </div>
            <span className="text-[10px] text-themeText-secondary">Unlocks after return window</span>
          </div>

          <div className="p-4 rounded-theme-lg bg-themeBg-surface border border-black/[0.05] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-themeText-secondary block">
                Your Referral Code
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-base font-mono font-black text-themeText-primary">
                  {user.referral_code || '—'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="px-2.5 py-1 bg-white border border-black/10 rounded-md text-[10px] font-bold hover:bg-gray-50"
                >
                  {copiedCode ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <span className="text-[10px] text-themeText-secondary mt-1">
              Share with friends to earn bonus points
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-white p-1.5 rounded-theme-lg border border-black/5 shadow-sm">
        {[
          { id: 'orders', label: `My Orders (${orders.length})` },
          { id: 'addresses', label: `Saved Addresses (${addresses.length})` },
          { id: 'points', label: 'Points History' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 px-3 rounded-theme-md text-xs font-bold transition-all ${
              activeTab === t.id
                ? 'bg-themePrimary text-white shadow-sm'
                : 'text-themeText-secondary hover:text-themeText-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PREVIOUS ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-theme-xl p-10 text-center border border-black/5 space-y-3">
              <p className="text-sm font-bold text-themeText-primary">No orders found yet</p>
              <p className="text-xs text-themeText-secondary">
                Any online or exhibition orders placed with +91 {user.phone} will appear here automatically.
              </p>
              <Link
                href="/"
                className="inline-block px-5 py-2.5 bg-themePrimary text-white text-xs font-bold rounded-theme-md"
              >
                Explore Bags
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-theme-xl p-4 sm:p-5 border border-black/5 shadow-sm space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.05] pb-3">
                  <div>
                    <span className="text-xs font-mono font-black text-themeText-primary">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-themeText-secondary block">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-800">
                      {order.status}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-3 py-1.5 rounded-theme-sm bg-themeBg-surface hover:bg-gray-200 text-xs font-bold text-themeText-primary"
                    >
                      View Invoice →
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        {item.image_url && (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-themeText-primary truncate">{item.title}</p>
                          <p className="text-[11px] text-themeText-secondary">
                            Qty: {item.quantity} · ₹{Number(item.unit_price).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-themeText-primary">
                        ₹{Number(item.total_price).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-xs">
                  <span className="text-amber-800 font-bold">
                    +{order.points_earned || 0} Leu Points earned
                  </span>
                  <span className="font-black text-sm text-themeText-primary">
                    Total Paid: ₹{Number(order.final_payable).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SAVED ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-themeText-primary">Delivery Addresses</h2>
            <button
              type="button"
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-4 py-2 bg-themePrimary text-white text-xs font-bold rounded-theme-md shadow-sm"
            >
              {showAddAddress ? 'Cancel' : '+ Add New Address'}
            </button>
          </div>

          {showAddAddress && (
            <form
              onSubmit={handleSaveAddress}
              className="bg-white rounded-theme-xl p-5 border border-black/10 shadow-sm space-y-3.5"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-themeText-secondary">
                New Shipping Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Recipient Full Name *"
                  value={addrForm.recipient_name}
                  onChange={(e) => setAddrForm({ ...addrForm, recipient_name: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                  required
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Delivery Phone *"
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                  required
                />
              </div>

              <input
                type="text"
                placeholder="House / Flat No., Building, Street *"
                value={addrForm.address_line1}
                onChange={(e) => setAddrForm({ ...addrForm, address_line1: e.target.value })}
                className="w-full h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Area / Locality (Optional)"
                  value={addrForm.address_line2}
                  onChange={(e) => setAddrForm({ ...addrForm, address_line2: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={addrForm.landmark}
                  onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City / District *"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                  required
                />
                <select
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm bg-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN Code *"
                  value={addrForm.postal_code}
                  onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })}
                  className="h-10 px-3 text-base sm:text-xs border rounded-theme-sm"
                  required
                />
              </div>

              <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 pt-1">
                <input
                  type="checkbox"
                  checked={addrForm.is_default}
                  onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })}
                />
                <span>Set as default delivery address</span>
              </label>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2.5 bg-themePrimary text-white text-xs font-bold rounded-theme-md"
                >
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="bg-white rounded-theme-xl p-8 text-center border border-black/5 text-xs text-themeText-secondary">
              No saved addresses yet. Add one above for faster checkout.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-theme-xl p-4 border border-black/5 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-themeText-primary">{addr.recipient_name}</span>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-themeText-secondary">{addr.address_line1}</p>
                    {addr.address_line2 && (
                      <p className="text-themeText-secondary">{addr.address_line2}</p>
                    )}
                    <p className="font-semibold text-themeText-primary">
                      {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                    <p className="text-[11px] text-gray-400">Phone: {addr.phone}</p>
                  </div>

                  <div className="pt-2 border-t border-black/[0.04] flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POINTS LEDGER */}
      {activeTab === 'points' && (
        <div className="bg-white rounded-theme-xl border border-black/5 shadow-sm overflow-hidden">
          {points.ledger.length === 0 ? (
            <div className="p-8 text-center text-xs text-themeText-secondary">
              No points activity recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {points.ledger.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-themeText-primary">
                      {entry.source.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[11px] text-themeText-secondary">
                      {new Date(entry.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · Status: <strong>{entry.status}</strong>
                    </span>
                  </div>
                  <span
                    className={`font-mono font-black text-sm ${
                      Number(entry.points) >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {Number(entry.points) >= 0 ? `+${entry.points}` : entry.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}