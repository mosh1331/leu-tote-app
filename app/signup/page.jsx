// app/signup/page.jsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { STORE_INFO } from '@/lib/data';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledPhone = (searchParams.get('phone') || '').replace(/\D/g, '').slice(-10);
  const redirectTarget = searchParams.get('redirect') || '/account';

  const [step, setStep] = useState('DETAILS'); // 'DETAILS' | 'OTP'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(prefilledPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  // Redirect immediately if user already has an active session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.replace(redirectTarget);
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => setCheckingSession(false));
  }, [router, redirectTarget]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
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
      setError('Please enter the 6-digit verification code.');
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
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');

      router.push(redirectTarget);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="text-center py-20 text-xs font-bold text-themeText-secondary animate-pulse">
        Checking account status...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Top Storefront Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-bold text-themeText-secondary hover:text-themeText-primary flex items-center space-x-1"
        >
          <span>←</span>
          <span>Back to {STORE_INFO.name}</span>
        </Link>
        <Link
          href="/account"
          className="text-xs font-bold text-themeText-primary hover:underline"
        >
          Already registered? Sign In
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-themeBg-card rounded-theme-xl p-6 sm:p-8 border border-black/5 shadow-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-themeText-secondary block">
            {STORE_INFO.name} Rewards &amp; Orders
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-themeText-primary tracking-tight">
            {step === 'DETAILS' ? 'Create Your Account' : 'Verify Your Number'}
          </h1>
          <p className="text-xs text-themeText-secondary">
            {step === 'DETAILS'
              ? 'Save delivery addresses, track orders, and unlock your Leu Points.'
              : `Enter the 6-digit verification code sent to +91 ${phone.slice(-10)}`}
          </p>
        </div>

        {/* Points & Guest History Callout */}
        <div className="p-3.5 rounded-theme-md bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs flex items-start space-x-2.5">
          <span className="text-base mt-0.5">🎁</span>
          <span className="leading-relaxed">
            Shopped with us earlier? Sign up with the <strong>same mobile number</strong> to automatically unlock your pending Leu Points and past order invoices.
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-theme-md bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: Name & Mobile Number */}
        {step === 'DETAILS' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-themeText-primary block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Meera Krishnan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-3.5 text-base sm:text-xs border border-gray-300 rounded-theme-md bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-themeText-primary block mb-1">
                Mobile Number *
              </label>
              <div className="flex items-center border border-gray-300 rounded-theme-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-black/10 focus-within:border-black transition-all">
                <span className="px-3.5 text-xs font-bold text-gray-500 bg-gray-50 border-r h-11 flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3.5 text-base sm:text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10 || !fullName.trim()}
              className="w-full h-11 bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold rounded-theme-md shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? 'Sending Code...' : 'Continue to Verification'}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-Digit Dummy OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-themeText-primary">
                  Enter 6-Digit OTP *
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
                  Edit Number
                </button>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full h-12 px-4 text-xl sm:text-lg font-mono font-black text-center tracking-[0.45em] border border-gray-300 rounded-theme-md bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                autoFocus
                required
              />

              <p className="text-[11px] text-themeText-secondary text-center mt-2">
                WhatsApp OTP integration active soon — enter test OTP:{' '}
                <strong className="font-mono text-themeText-primary bg-themeBg-surface px-1.5 py-0.5 rounded">
                  123456
                </strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-11 bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold rounded-theme-md shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? 'Creating Account...' : 'Verify & Unlock Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-themeBg-canvas text-themeText-primary flex items-center justify-center py-8 px-4 sm:px-6">
      <Suspense
        fallback={
          <div className="text-xs font-bold text-themeText-secondary">
            Loading Sign Up...
          </div>
        }
      >
        <SignupContent />
      </Suspense>
    </div>
  );
}