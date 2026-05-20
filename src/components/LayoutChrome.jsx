'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

/** Hides global theme header on home (navbar includes ThemeToggle). */
export default function LayoutChrome({ children }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      {!isHome ? (
        <header className="app-layout-header">
          <ThemeToggle />
        </header>
      ) : null}
      {children}
    </>
  );
}
