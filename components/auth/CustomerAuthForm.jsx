// components/auth/CustomerAuthForm.jsx
'use client';

import { useState } from 'react';
import { STORE_INFO } from '@/lib/data';

export default function CustomerAuthForm({ onSuccess }) {
  const [step, setStep] = useState('DETAILS'); // 'DETAILS' | 'OTP'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send OTP');

      setStep('OTP');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, '').slice(-10),
          otp: otp.trim(),
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-themeBg-card rounded-theme-xl p-6 sm:p-8 border border-black/5 shadow-sm space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-themeText-secondary">
          {STORE_INFO.name} Account
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-themeText-primary">
          {step === 'DETAILS' ? 'Sign In or Create Account' : 'Verify Mobile Number'}
        </h1>
        <p className="text-xs text-themeText-secondary">
          {step === 'DETAILS'
            ? 'Access past orders, saved addresses, and unlock your Leu Points.'
            : `Enter the 6-digit code for +91 ${phone.slice(-10)}`}
        </p>
      </div>

      {/* Reward Callout */}
      <div className="p-3 rounded-theme-md bg-amber-50 border border-amber-200/80 text-amber-950 text-xs flex items-center space-x-2.5">
        <span className="text-lg">🎁</span>
        <span>
          Ordered as a guest before? Sign in with the same number to unlock your earned points &amp; orders!
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-theme-md bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      {step === 'DETAILS' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-themeText-primary block mb-1">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ananya Menon (optional if returning)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 text-base sm:text-xs border border-gray-300 rounded-theme-md bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-themeText-primary block mb-1">
              Mobile Number *
            </label>
            <div className="flex items-center border border-gray-300 rounded-theme-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-black/10">
              <span className="px-3 text-xs font-bold text-gray-500 bg-gray-50 border-r h-11 flex items-center">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full h-11 px-3 text-base sm:text-xs font-mono focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full h-11 bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold rounded-theme-md shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? 'Sending Code...' : 'Continue with OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-themeText-primary">
                6-Digit Verification Code *
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep('DETAILS');
                  setOtp('');
                  setError('');
                }}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Change Number
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full h-12 px-4 text-xl sm:text-lg font-mono font-black text-center tracking-[0.45em] border border-gray-300 rounded-theme-md bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              autoFocus
              required
            />
            <p className="text-[11px] text-themeText-secondary text-center mt-1.5">
              WhatsApp OTP integration coming soon — use test code{' '}
              <strong className="font-mono text-themeText-primary">123456</strong>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full h-11 bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold rounded-theme-md shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? 'Verifying...' : 'Verify & Open Account'}
          </button>
        </form>
      )}
    </div>
  );
}