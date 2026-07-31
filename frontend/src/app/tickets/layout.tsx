'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  LinkButton,
} from '@/src/components/ui/Button';
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
              className="inline-flex items-center gap-2 text-xl font-bold text-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-content font-black text-sm">
                HD
              </div>
              <span>HelpDesk</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            <LinkButton
              href="/tickets"
              size="sm"
              variant={
                pathname === '/tickets'
                  ? 'primary'
                  : 'secondary'
              }
              className="text-sm font-medium normal-case"
            >
              All Tickets
            </LinkButton>

            <LinkButton
              href="/tickets/new"
              size="sm"
              variant={
                pathname === '/tickets/new'
                  ? 'primary'
                  : 'secondary'
              }
              className="text-sm font-medium normal-case"
            >
              Create Ticket
            </LinkButton>
          </div>

          {/* User Actions */}
          <div className="flex-none gap-2">
            <Button
              onClick={handleLogout}
              size="sm"
              variant="danger"
              className="text-xs font-medium normal-case"
            >
              Sign Out
            </Button>
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
