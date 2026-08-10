"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  PlusCircle,
  HelpCircle,
  User,
  ShieldCheck,
  Settings,
  Briefcase,
  LogOut,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { NotificationBell } from "@/src/components/ui/NotificationBell";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { Avatar } from "@/src/components/ui/Avatar";
import { useAuth } from "@/src/context/AuthContext";
import { getTicketViewLabel } from "@/src/lib/ticketPermissions";

// Rol bazlı rozet (Badge) stilleri
const getRoleBadgeStyle = (role?: string): string => {
  const normalized = role?.toLowerCase().trim();
  switch (normalized) {
    case "admin":
    case "0":
      // 💖 NEON PINK / PEMBE EFEKTİ (Dark Mode)
      return "bg-amber-500/15 text-amber-700 dark:bg-pink-500/25 dark:text-pink-300 border-amber-600/30 dark:border-pink-400/80 dark:shadow-[0_0_12px_rgba(244,114,182,0.35)]";
    case "teamleader":
    case "1":
      return "bg-emerald-500/15 text-emerald-800 dark:bg-rose-500/20 dark:text-rose-300 border-emerald-600/30 dark:border-rose-500/40";
    case "supportagent":
    case "2":
      return "bg-teal-500/15 text-teal-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-teal-600/30 dark:border-indigo-500/40";
    default:
      return "bg-stone-500/15 text-stone-700 dark:bg-slate-500/20 dark:text-slate-300 border-stone-500/30 dark:border-slate-500/40";
  }
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const viewLabel = getTicketViewLabel(user?.role);

  const isCreateTicketPage = pathname === "/tickets/new";
  const isTicketsSection = pathname === "/tickets";
  const isTeamChatPage = pathname.startsWith("/tickets/chat");
  const isFaqPage = pathname === "/faq";
  const isTeamManagementPage = pathname.startsWith("/tickets/team-management");
  const isMyWorkPage = pathname.startsWith("/tickets/my-work");
  const isProfilePage = pathname === "/tickets/profile";

  // Rol değerini normalize ederek kontrol etme
  const normalizedRole = user?.role?.toLowerCase().trim();
  const canAccessChat =
    normalizedRole === "teamleader" ||
    normalizedRole === "supportagent" ||
    normalizedRole === "1" ||
    normalizedRole === "2";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = () => {
    logout();
  };

  const displayName =
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const userRole = user?.role || "User";

  const navItems = [
    {
      href: "/tickets",
      label: viewLabel.navigationLabel,
      icon: Ticket,
      isActive: isTicketsSection,
    },
    {
      href: "/tickets/new",
      label: "Create Ticket",
      icon: PlusCircle,
      isActive: isCreateTicketPage,
    },
    ...(canAccessChat
      ? [
          {
            href: "/tickets/chat",
            label: "Team Chat",
            icon: MessageCircle,
            isActive: isTeamChatPage,
          },
        ]
      : []),
    {
      href: "/faq",
      label: "FAQ",
      icon: HelpCircle,
      isActive: isFaqPage,
    },
  ];

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-slate-950 text-stone-800 dark:text-slate-100 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 dark:border-purple-500 border-t-transparent"></div>
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/30 dark:bg-slate-950 text-stone-800 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-amber-900/10 dark:border-purple-900/30 bg-stone-100/80 dark:bg-slate-900/70 backdrop-blur-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/tickets"
              className="group inline-flex items-center gap-3 text-lg font-bold tracking-tight transition-all"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-teal-600 to-emerald-600 dark:from-purple-600 dark:via-violet-600 dark:to-indigo-500 text-white shadow-lg shadow-teal-600/20 dark:shadow-purple-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 overflow-hidden">
                <svg
                  className="h-6 w-6 text-white drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" opacity="0.9" />
                  <path d="M2 20c4-2 9-2 13 0" strokeWidth="2" />
                  <path d="M11 20c0-4 1.5-7 4-10" strokeWidth="2" />
                  <path d="M15 10c-3-2-6-1-7 1" />
                  <path d="M15 10c2-3 4-3 6-1" />
                  <path d="M15 10c0-3 2-5 4-5" />
                  <path d="M15 10c-2-3-4-3-5-5" />
                </svg>
              </div>

              <div className="flex flex-col leading-none">
                <span className="font-black text-base tracking-wider bg-gradient-to-r from-amber-700 via-emerald-700 to-teal-800 dark:from-purple-400 dark:via-violet-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  ISLAND
                </span>
                <span className="text-[10px] font-bold tracking-widest text-stone-500 dark:text-purple-300/60 uppercase">
                  HelpDesk
                </span>
              </div>
            </Link>
          </div>

          {/* Navigasyon Linkleri */}
          <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl border border-stone-300/60 dark:border-purple-900/40 bg-stone-200/60 dark:bg-slate-900/80 backdrop-blur-xl shadow-inner relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 z-10 ${
                    item.isActive
                      ? "text-white"
                      : "text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {item.isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 z-[-1]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sağ Aksiyonlar */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2.5 rounded-2xl border border-stone-300/70 dark:border-purple-800/40 bg-stone-100/90 dark:bg-slate-900/90 p-1.5 pr-3.5 hover:border-emerald-600/40 dark:hover:border-purple-500/50 hover:bg-stone-200/50 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm group"
              >
                <Avatar
                  avatarUrl={user?.avatarUrl}
                  className="shadow-sm border border-stone-300 dark:border-purple-700 group-hover:scale-105 transition-transform"
                  name={displayName}
                  size="sm"
                />

                <div className="hidden sm:flex flex-col text-left max-w-[130px]">
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-100 leading-tight truncate">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${getRoleBadgeStyle(
                        user?.role
                      )}`}
                    >
                      {userRole}
                    </span>
                  </div>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-stone-400 dark:text-purple-300/60 group-hover:text-stone-700 dark:group-hover:text-purple-300 transition-colors ml-0.5" />
              </div>

              <ul
                tabIndex={0}
                className="dropdown-content menu z-[50] mt-2.5 w-64 rounded-2xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-100/95 dark:bg-slate-900/95 backdrop-blur-2xl p-2 shadow-2xl space-y-1"
              >
                <li className="menu-title border-b border-stone-200 dark:border-slate-800 pb-2.5 mb-1 px-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-purple-300/50 block mb-0.5">
                    Signed in as
                  </span>
                  <span
                    className="text-xs font-bold text-stone-800 dark:text-slate-100 normal-case p-0 truncate block max-w-full font-mono"
                    title={user?.email}
                  >
                    {user?.email}
                  </span>
                </li>

                <li>
                  <Link
                    aria-current={isProfilePage ? "page" : undefined}
                    href="/tickets/profile"
                    className={`flex items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                      isProfilePage
                        ? "bg-emerald-500/15 text-emerald-800 dark:bg-purple-500/20 dark:text-purple-300 font-bold"
                        : "text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <User className="h-4 w-4 text-stone-500 dark:text-purple-400" />
                    <span>Profile</span>
                  </Link>
                </li>

                {user?.role === "Admin" && (
                  <li>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-amber-500/15 hover:text-amber-800 dark:hover:bg-pink-500/20 dark:hover:text-pink-300 transition-all"
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-pink-400" />
                      <span>Admin Panel</span>
                    </Link>
                  </li>
                )}

                {user?.role === "TeamLeader" && (
                  <li>
                    <Link
                      aria-current={isTeamManagementPage ? "page" : undefined}
                      href="/tickets/team-management"
                      className={`flex items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                        isTeamManagementPage
                          ? "bg-emerald-500/15 text-emerald-800 dark:bg-rose-500/20 dark:text-rose-300 font-bold"
                          : "text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <Settings className="h-4 w-4 text-emerald-600 dark:text-rose-400" />
                      <span>Management Page</span>
                    </Link>
                  </li>
                )}

                {user?.role === "SupportAgent" && (
                  <li>
                    <Link
                      aria-current={isMyWorkPage ? "page" : undefined}
                      href="/tickets/my-work"
                      className={`flex items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                        isMyWorkPage
                          ? "bg-teal-500/15 text-teal-800 dark:bg-blue-500/20 dark:text-blue-300 font-bold"
                          : "text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <Briefcase className="h-4 w-4 text-teal-600 dark:text-blue-400" />
                      <span>My Work</span>
                    </Link>
                  </li>
                )}

                <div className="my-1 border-t border-stone-200 dark:border-slate-800" />

                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/15 transition-all w-full text-left"
                  >
                    <LogOut className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}