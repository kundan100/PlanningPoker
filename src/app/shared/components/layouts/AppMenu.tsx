'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const modules = [
  { name: 'Dashboard', path: '/' },
  { name: 'Poker', path: '/poker' },
  // Add more modules here later
];

export default function AppMenu() {
  const pathname = usePathname();

  // component-return
  return (
    <aside
      style={{
        width: '200px',
        background: 'darkgrey', // '#f9f9f9',
        padding: '1rem 0.5rem',
        borderRight: '1px solid #ccc',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {modules.map((mod) => {
          const isActive = pathname.startsWith(mod.path);
          return (
            <Link
              key={mod.name}
              href={mod.path}
              style={{
                display: 'block',
                padding: '0.75rem 0.5rem',
                background: isActive ? '#5bebdd' : '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                color: '#333',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {mod.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
