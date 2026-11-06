// app/admin/login/page.jsx
'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleVerifyPin = async (submittedPin) => {
    const pinToVerify = submittedPin || pin;
    if (pinToVerify.length !== 4) {
      setErrorMsg('Enter all 4 characters of your admin PIN');
      triggerShake();
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Incorrect security PIN');
      }

      // Route smoothly to targeted admin page
      router.push(redirectTarget);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
      triggerShake();
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value.slice(0, 4);
    setPin(val);
    setErrorMsg('');

    // Auto-submit once 4 characters are entered
    if (val.length === 4) {
      handleVerifyPin(val);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      {/* Centered Auth Card Container */}
      <div
        className={`bg-themeBg-card rounded-theme-xl p-6 sm:p-10 border border-black/5 shadow-xl transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 bg-themeBg-surface rounded-2xl flex items-center justify-center mx-auto text-2xl border border-black/5 shadow-sm">
            🔐
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-themeText-primary tracking-tight">
            Leu Tote
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-themeText-secondary">
            Backoffice Gateway
          </p>
        </div>

        {/* PIN Entry Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyPin();
          }}
          className="space-y-6"
        >
          <div className="space-y-3 text-center">
            <label className="text-xs font-bold text-themeText-secondary block">
              Enter 4-Digit Security PIN
            </label>

            {/* Hidden/Transparent Native Input over Interactive Boxes */}
            <div className="relative flex justify-center">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="off"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-xl sm:text-lg font-mono text-center tracking-[0.5em]"
                aria-label="4-Digit PIN"
              />

              {/* 4 Discrete Indicator Boxes */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                {[0, 1, 2, 3].map((idx) => {
                  const digit = pin[idx];
                  const isCurrent = pin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-theme-md border-2 flex items-center justify-center text-xl sm:text-2xl font-black transition-all ${
                        digit
                          ? 'border-themePrimary bg-themeBg-surface text-themeText-primary shadow-sm'
                          : isCurrent
                          ? 'border-themePrimary ring-4 ring-themePrimary/10 bg-white'
                          : 'border-black/10 bg-gray-50/50 text-transparent'
                      }`}
                    >
                      {digit ? '•' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message Warning */}
            {errorMsg ? (
              <p className="text-xs font-bold text-red-600 bg-red-50 py-1.5 px-3 rounded-lg border border-red-100 animate-fade-in">
                ⚠️ {errorMsg}
              </p>
            ) : (
              <p className="text-[11px] text-themeText-muted">
                Tap above to enter your access credentials
              </p>
            )}
          </div>

          {/* Explicit Submit Action */}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3.5 px-4 rounded-theme-md bg-themePrimary hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Verifying PIN...</span>
              </>
            ) : (
              <span>Unlock Backoffice</span>
            )}
          </button>
        </form>

        {/* Return to Public Catalog */}
        <div className="mt-8 pt-4 border-t border-black/5 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-themeText-secondary hover:text-themeText-primary transition-colors"
          >
            ← Return to Public Store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-themeBg-canvas flex items-center justify-center p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="text-xs font-bold text-gray-500">
            Loading Backoffice Gateway...
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}