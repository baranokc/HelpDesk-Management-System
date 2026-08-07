"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/src/context/AuthContext";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

// Renkli SVG İkonlar
const OverviewIcon = () => (
  <svg className="w-4 h-4 text-sky-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4 text-indigo-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TeamsIcon = () => (
  <svg className="w-4 h-4 text-blue-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CsatIcon = () => (
  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CategoriesIcon = () => (
  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const FaqIcon = () => (
  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AuditLogsIcon = () => (
  <svg className="w-4 h-4 text-stone-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BackArrowIcon = () => (
  <svg className="w-4 h-4 text-stone-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    if (!loading) {
      if (!user || user.role !== "Admin") {
        router.replace("/tickets");
      }
    }
  }, [user, loading, router]);

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
    { label: "CSAT Analytics", href: "/admin/csat", icon: <CsatIcon /> },
    { label: "Categories", href: "/admin/categories", icon: <CategoriesIcon /> },
    { label: "FAQ Management", href: "/admin/faq", icon: <FaqIcon /> },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: <AuditLogsIcon /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] gap-6 py-4 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ANIMASYONLU SIDEBAR */}
      <motion.aside 
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full lg:w-64 shrink-0 rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl transition-colors flex flex-col justify-between"
      >
        <div className="space-y-5">
          <div className="px-3 pt-1">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-purple-300/50">
              Admin Portal
            </h2>
            <p className="text-sm font-extrabold text-stone-900 dark:text-slate-100">
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
                  className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 [&_svg]:!text-white z-10"
                      : "text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/80 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {/* Aktif Sekme İçin Yumuşak Arka Plan Geçiş Animasyonu */}
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminNavPill"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 z-[-1]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className={`flex h-6 w-6 items-center justify-center rounded-xl transition-colors ${
                    isActive ? "bg-white/20" : ""
                  }`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* TICKET ANA SAYFASINA DÖNÜŞ BUTONU */}
        <div className="pt-4 mt-6 border-t border-stone-100 dark:border-slate-800/80">
          <Link
            href="/tickets"
            className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/80 transition-all"
          >
            <BackArrowIcon />
            <span>Back to App</span>
          </Link>
        </div>
      </motion.aside>

      {/* İÇERİK ALANI (ANİMASYONLU SAYFA GEÇİŞİ) */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}