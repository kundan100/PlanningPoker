'use client';

import Link from 'next/link';

export default function PokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link href="/poker" style={{ marginRight: '1rem' }}>Home</Link>
        <Link href="/poker/about-us" style={{ marginRight: '1rem' }}>About Us</Link>
        <Link href="/poker/connect-us">Connect Us</Link>
      </nav>

      <main style={{ padding: '1rem' }}>
        {children}
      </main>
    </div>
  );
}
