"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "Admin" && user.role !== "SupportAgent"))) {
      router.replace("/tickets");
    }
  }, [user, loading, router]);

  if (loading || (!user || (user.role !== "Admin" && user.role !== "SupportAgent"))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Checking admin permissions..." />
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: "📊" },
    { label: "User Management", href: "/admin/users", icon: "👥" },
    { label: "Teams", href: "/admin/teams", icon: "🛡️" },
    { label: "Categories", href: "/admin/categories", icon: "🏷️" },
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
                  <span>{item.icon}</span>
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
            <span>←</span> Back to App
          </Link>
        </div>
      </aside>

      {/* İÇERİK ALANI */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}