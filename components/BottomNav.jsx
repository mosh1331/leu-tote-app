// components/BottomNav.jsx
import Link from 'next/link';

export default function BottomNav({ activeTab = 'home' }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-themeBg-muted px-6 py-2.5 flex justify-between items-center z-40">
      <Link href="/" className={`text-xs font-medium ${activeTab === 'home' ? 'text-themeText-primary' : 'text-themeText-muted'}`}>
        Home
      </Link>
      <Link href="/checkout" className={`text-xs font-medium ${activeTab === 'cart' ? 'text-themeText-primary' : 'text-themeText-muted'}`}>
        Cart
      </Link>
      <Link href="/rewards" className={`text-xs font-medium ${activeTab === 'profile' ? 'text-themeText-primary' : 'text-themeText-muted'}`}>
        Rewards
      </Link>
    </nav>
  );
}