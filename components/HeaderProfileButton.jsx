// components/HeaderProfileButton.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeaderProfileButton() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setChecked(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Subtle placeholder matching button height to prevent layout shift
  if (!checked) {
    return (
      <Link
        href="/account"
        aria-label="Account"
        className="h-9 sm:h-10 px-3 rounded-full bg-themeBg-surface border border-black/[0.06] flex items-center justify-center text-themeText-primary"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </Link>
    );
  }

  // Signed-in state: Initial avatar + First Name -> /account
  if (user) {
    const firstName = (user.full_name || 'Member').trim().split(' ')[0];
    const initial = firstName.charAt(0).toUpperCase();

    return (
      <Link
        href="/account"
        aria-label="My Account"
        className="h-9 sm:h-10 pl-1.5 pr-3 sm:pr-3.5 rounded-full bg-themeBg-surface hover:bg-black/5 border border-black/[0.08] flex items-center space-x-2 text-themeText-primary transition-all active:scale-95"
      >
        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-themePrimary text-white text-[11px] font-black flex items-center justify-center">
          {initial}
        </span>
        <span className="hidden sm:inline text-xs font-bold truncate max-w-[84px]">
          {firstName}
        </span>
      </Link>
    );
  }

  // Signed-out state: Compact Login / Sign Up pill -> /signup
  return (
    <Link
      href="/signup"
      aria-label="Login or Sign up"
      className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-full bg-themeBg-surface hover:bg-black/5 border border-black/[0.08] flex items-center space-x-1.5 text-themeText-primary text-xs font-bold transition-all active:scale-95"
    >
      <svg className="w-4 h-4 text-themeText-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span>Login</span>
    </Link>
  );
}