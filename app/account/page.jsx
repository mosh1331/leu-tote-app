// app/account/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomerAuthForm from '@/components/auth/CustomerAuthForm';
import CustomerDashboard from '@/components/auth/CustomerDashboard';
import { STORE_INFO } from '@/lib/data';

export default function CustomerAccountPage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlockedBanner, setUnlockedBanner] = useState(0);

  const loadSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        setProfileData(null);
      }
    } catch (err) {
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleAuthSuccess = async (verifyResponse) => {
    if (verifyResponse?.newlyUnlockedPoints > 0) {
      setUnlockedBanner(verifyResponse.newlyUnlockedPoints);
    }
    setLoading(true);
    await loadSession();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setProfileData(null);
    setUnlockedBanner(0);
  };

  return (
    <div className="min-h-screen bg-themeBg-canvas text-themeText-primary py-6 px-4 sm:py-10 sm:px-6">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-bold text-themeText-secondary hover:text-themeText-primary"
        >
          ← Back to {STORE_INFO.name}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs font-bold text-themeText-secondary animate-pulse">
          Checking account session...
        </div>
      ) : profileData?.authenticated ? (
        <CustomerDashboard
          profileData={profileData}
          unlockedBanner={unlockedBanner}
          onRefresh={loadSession}
          onLogout={handleLogout}
        />
      ) : (
        <CustomerAuthForm onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}