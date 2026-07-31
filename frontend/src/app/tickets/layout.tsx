'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext'; 

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
 
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

 
  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-sm font-medium text-slate-500">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 🧭 TOP NAVBAR (DaisyUI Navbar) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand / Logo */}
          <div className="flex-1">
            <Link
              href="/tickets"
              className="btn btn-ghost text-xl normal-case font-bold gap-2 text-slate-900 hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-content font-black text-sm">
                HD
              </div>
              <span>HelpDesk</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            <Link
              href="/tickets"
              className={`btn btn-sm text-sm font-medium normal-case ${
                pathname === '/tickets'
                  ? 'btn-primary text-white'
                  : 'btn-ghost text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Tickets
            </Link>
            <Link
              href="/tickets/new"
              className={`btn btn-sm text-sm font-medium normal-case ${
                pathname === '/tickets/new'
                  ? 'btn-primary text-white'
                  : 'btn-ghost text-slate-600 hover:bg-slate-100'
              }`}
            >
              Create Ticket
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex-none gap-2">
            {/* 🚀 Logout fonksiyonunu direkt context'ten çağırdık */}
            <button
              onClick={logout}
              className="btn btn-outline btn-error btn-sm font-medium text-xs normal-case"
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