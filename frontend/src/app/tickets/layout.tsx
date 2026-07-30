'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/src/services/authService';

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = authService.getToken();

    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-medium text-slate-500">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 🧭 TOP NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link
              href="/tickets"
              className="flex items-center space-x-2 text-xl font-bold text-slate-900"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
                HD
              </div>
              <span>HelpDesk</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/tickets"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/tickets'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              All Tickets
            </Link>
            <Link
              href="/tickets/new"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/tickets/new'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Create Ticket
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 📐 MAIN CONTENT AREA */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}