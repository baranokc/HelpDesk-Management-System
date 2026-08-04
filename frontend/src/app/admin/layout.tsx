"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

// Inline SVG Ikonlar
const OverviewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TeamsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CategoriesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const BackArrowIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Yükleme bittiğinde kullanıcı yoksa veya rolü Admin değilse direkt /tickets sayfasına yönlendir
    if (!loading) {
      if (!user || user.role !== "Admin") {
        router.replace("/tickets");
      }
    }
  }, [user, loading, router]);

  // Sadece yetkili Admin geçebilir; diğer durumlarda yükleniyor ekranı kalır
  if (loading || !user || user.role !== "Admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Checking admin permissions..." />
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: <OverviewIcon /> },
    { label: "User Management", href: "/admin/users", icon: <UsersIcon /> },
    { label: "Teams", href: "/admin/teams", icon: <TeamsIcon /> },
    { label: "Categories", href: "/admin/categories", icon: <CategoriesIcon /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-6 py-4">
      {/* SIDEBAR */}
      <aside className="w-64 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors flex flex-col justify-between">
        <div className="space-y-6">
          <div className="px-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Admin Portal
            </h2>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              System Settings
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* TICKET ANA SAYFASINA DÖNÜŞ BUTONU */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/tickets"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <BackArrowIcon />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* İÇERİK ALANI */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}