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

// ☁️ Bembeyaz & Süzülen Estetik Vektörel Bulut Bileşeni
function FloatingCloud({
  top,
  scale = 1,
  duration = 40,
  delay = 0,
  variant = 1,
}: {
  top: string;
  scale?: number;
  duration?: number;
  delay?: number;
  variant?: 1 | 2 | 3 | 4;
}) {
  const renderCloudPath = () => {
    switch (variant) {
      case 1:
        /* Yumuşak Pofuduk Bulut */
        return (
          <svg
            width="160"
            height="60"
            viewBox="0 0 160 60"
            fill="none"
            className="text-white opacity-90 dark:opacity-100 dark:text-purple-400/25 transition-colors duration-300 drop-shadow-[0_4px_12px_rgba(186,230,253,0.6)] dark:drop-shadow-[0_0_12px_rgba(192,132,252,0.15)]"
          >
            <path
              d="M 20 50 C 8 50, 2 38, 14 28 C 10 14, 30 6, 48 12 C 62 -2, 92 -2, 106 10 C 122 2, 144 10, 148 26 C 160 30, 158 50, 140 50 Z"
              fill="currentColor"
            />
          </svg>
        );
      case 2:
        /* Akıcı & İnce Atmosferik Bulut */
        return (
          <svg
            width="180"
            height="45"
            viewBox="0 0 180 45"
            fill="none"
            className="text-white opacity-80 dark:opacity-100 dark:text-indigo-400/20 transition-colors duration-300 drop-shadow-[0_4px_10px_rgba(186,230,253,0.5)] dark:drop-shadow-[0_0_12px_rgba(129,140,248,0.15)]"
          >
            <path
              d="M 15 38 C 5 38, 2 28, 12 22 C 10 10, 32 2, 52 8 C 68 -2, 98 -2, 112 8 C 128 0, 152 6, 158 18 C 172 20, 175 32, 160 38 Z"
              fill="currentColor"
            />
          </svg>
        );
      case 3:
        /* Tombul Şirin Gökyüzü Bulutu */
        return (
          <svg
            width="140"
            height="52"
            viewBox="0 0 140 52"
            fill="none"
            className="text-white opacity-85 dark:opacity-100 dark:text-purple-300/25 transition-colors duration-300 drop-shadow-[0_4px_12px_rgba(186,230,253,0.55)] dark:drop-shadow-[0_0_12px_rgba(216,180,254,0.18)]"
          >
            <path
              d="M 18 45 C 8 45, 4 32, 14 24 C 16 10, 36 4, 52 12 C 64 2, 86 2, 98 12 C 110 4, 130 10, 132 24 C 142 30, 140 45, 122 45 Z"
              fill="currentColor"
            />
          </svg>
        );
      case 4:
        /* İhtişamlı Ufuk Bulutu */
        return (
          <svg
            width="210"
            height="70"
            viewBox="0 0 210 70"
            fill="none"
            className="text-white opacity-95 dark:opacity-100 dark:text-violet-400/20 transition-colors duration-300 drop-shadow-[0_6px_14px_rgba(186,230,253,0.65)] dark:drop-shadow-[0_0_14px_rgba(167,139,250,0.15)]"
          >
            <path
              d="M 25 62 C 10 62, 4 48, 16 36 C 12 20, 36 8, 58 16 C 74 2, 108 -2, 130 12 C 152 2, 182 10, 188 30 C 206 36, 208 56, 188 62 Z"
              fill="currentColor"
            />
          </svg>
        );
    }
  };

  return (
    <motion.div
      initial={{ x: "-22vw" }}
      animate={{
        x: "118vw",
        y: [0, -6, 4, 0],
      }}
      transition={{
        x: { duration, repeat: Infinity, ease: "linear", delay },
        y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay },
      }}
      style={{ top, scale }}
      className="absolute left-0 pointer-events-none z-0"
    >
      {renderCloudPath()}
    </motion.div>
  );
}

// 🏝️ Gece/Gündüz Detaylı Ada
function SyncedIsland() {
  return (
    <motion.div
      animate={{ x: [-18, 18, -18], y: [0, -6, 0] }}
      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-10 md:bottom-12 left-[0.2%] md:left-[1%] pointer-events-none z-[2]"
    >
      <svg
        width="240"
        height="105"
        viewBox="0 0 240 105"
        fill="none"
        className="drop-shadow-2xl"
      >
        <ellipse cx="120" cy="90" rx="100" ry="12" className="fill-teal-600/20 dark:fill-indigo-950/40" />

        <path
          d="M 10 88 C 60 42, 160 38, 230 88 Z"
          className="fill-amber-600/85 dark:fill-indigo-950/90"
        />
        <path
          d="M 20 88 C 70 48, 150 44, 215 88 Z"
          className="fill-amber-500 dark:fill-indigo-900/90"
        />
        <path
          d="M 35 88 C 80 54, 138 52, 195 88 Z"
          className="fill-yellow-200 dark:fill-indigo-800/80"
        />

        <path
          d="M 160 68 C 152 45, 155 28, 172 12"
          className="stroke-amber-900 dark:stroke-slate-900"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 160 68 C 152 45, 155 28, 172 12"
          className="stroke-amber-700 dark:stroke-slate-800"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path d="M 158 60 Q 161 58, 164 61" className="stroke-amber-950 dark:stroke-slate-950" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 156 50 Q 159 48, 162 51" className="stroke-amber-950 dark:stroke-slate-950" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 155 40 Q 158 38, 161 41" className="stroke-amber-950 dark:stroke-slate-950" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 158 30 Q 161 28, 164 31" className="stroke-amber-950 dark:stroke-slate-950" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 163 21 Q 166 19, 169 22" className="stroke-amber-950 dark:stroke-slate-950" strokeWidth="1.5" strokeLinecap="round" />

        <circle cx="168" cy="16" r="4" className="fill-amber-950 dark:fill-slate-950" />
        <circle cx="174" cy="18" r="3.8" className="fill-amber-900 dark:fill-slate-900" />
        <circle cx="171" cy="21" r="3.5" className="fill-stone-900 dark:fill-black" />

        <path d="M 172 12 C 170 -8, 185 -18, 192 -15 C 182 2, 175 8, 172 12 Z" className="fill-emerald-700 dark:fill-teal-900" />
        <path d="M 172 12 C 195 -2, 218 5, 228 16 C 208 15, 188 15, 172 12 Z" className="fill-emerald-600 dark:fill-emerald-950" />
        <path d="M 172 12 C 200 18, 222 30, 226 42 C 202 32, 185 24, 172 12 Z" className="fill-emerald-700 dark:fill-teal-900" />
        <path d="M 172 12 C 148 -4, 126 0, 115 10 C 135 11, 154 12, 172 12 Z" className="fill-emerald-600 dark:fill-emerald-950" />
        <path d="M 172 12 C 140 12, 120 22, 110 34 C 130 26, 150 20, 172 12 Z" className="fill-emerald-700 dark:fill-teal-900" />
        <path d="M 172 12 C 165 25, 158 38, 152 48 C 168 36, 172 26, 172 12 Z" className="fill-green-500 dark:fill-teal-800" />
      </svg>
    </motion.div>
  );
}

// 🌊 Katmanlı Dalgalı Deniz
function OceanWaves() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 pointer-events-none z-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 -left-[5%] -right-[5%] h-full text-sky-400/25 dark:text-indigo-950/60"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-[110%] h-full fill-current"
        >
          <path d="M0,20 C150,80 350,-30 500,40 C650,110 900,-20 1200,30 L1200,120 L0,120 Z" />
        </svg>
      </motion.div>

      <motion.div
        animate={{ x: [-25, 25, -25], y: [0, -5, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 -left-[5%] -right-[5%] h-28 md:h-40 text-sky-500/35 dark:text-purple-950/50"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-[110%] h-full fill-current"
        >
          <path d="M0,40 C250,95 450,10 700,60 C950,110 1080,25 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </motion.div>

      <motion.div
        animate={{ x: [15, -20, 15], y: [0, 3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 -left-[5%] -right-[5%] h-20 md:h-32 text-cyan-500/40 dark:text-sky-900/55 z-[3]"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-[110%] h-full fill-current"
        >
          <path d="M0,50 C180,90 400,20 650,75 C900,125 1050,30 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </motion.div>
    </div>
  );
}

// ☀️ Güneş, 🌙 Ay, ☁️ Bembeyaz Bulutlar, 🏝️ Ada & 🌊 Deniz
function BackgroundDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* ☀️ GÜNEŞ + IŞINLARI (Gündüz / Light Mode) */}
      <div className="absolute top-20 right-8 md:right-16 dark:hidden flex items-center justify-center pointer-events-none z-0">
        <div className="absolute w-44 h-44 rounded-full bg-amber-300/30 blur-3xl animate-pulse" />

        <motion.svg
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute w-36 h-36 text-amber-400/70"
          viewBox="0 0 100 100"
        >
          <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="50" y1="8" x2="50" y2="1" />
            <line x1="50" y1="92" x2="50" y2="99" />
            <line x1="8" y1="50" x2="1" y2="50" />
            <line x1="92" y1="50" x2="99" y2="50" />
            <line x1="20" y1="20" x2="14" y2="14" />
            <line x1="80" y1="80" x2="86" y2="86" />
            <line x1="20" y1="80" x2="14" y2="86" />
            <line x1="80" y1="20" x2="86" y2="14" />
          </g>
        </motion.svg>

        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 via-amber-400 to-orange-400 shadow-[0_0_45px_rgba(251,191,36,0.6)] border border-amber-200/70" />
      </div>

      {/* 🌙 AY (Gece / Dark Mode) */}
      <div className="absolute top-20 right-8 md:right-16 hidden dark:flex items-center justify-center pointer-events-none z-0">
        <div className="absolute w-48 h-48 rounded-full bg-purple-600/20 blur-3xl animate-pulse" />
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 via-indigo-100 to-purple-200 shadow-[0_0_35px_rgba(168,85,247,0.35)] border border-purple-300/30 flex items-center justify-center overflow-hidden">
            <div className="absolute -top-1 -right-2 w-12 h-12 rounded-full bg-slate-950/85" />
          </div>
        </motion.div>
      </div>

      {/* ☁️ Light Mode'da Bembeyaz Süzülen Bulutlar */}
      <FloatingCloud variant={1} top="80px" duration={42} delay={0} scale={1} />
      <FloatingCloud variant={2} top="150px" duration={36} delay={12} scale={0.85} />
      <FloatingCloud variant={3} top="220px" duration={48} delay={5} scale={1.1} />
      <FloatingCloud variant={4} top="310px" duration={54} delay={22} scale={1.25} />

      {/* 🏝️ Sol Tarafta Senkronize Ada */}
      <SyncedIsland />

      {/* 🌊 Doğal Katmanlı Deniz */}
      <OceanWaves />
    </div>
  );
}

// Rol bazlı rozet (Badge) stilleri
const getRoleBadgeStyle = (role?: string): string => {
  const normalized = role?.toLowerCase().trim();
  switch (normalized) {
    case "admin":
    case "0":
      return "bg-amber-500/15 text-amber-800 dark:bg-pink-500/25 dark:text-pink-300 border-amber-600/30 dark:border-pink-400/80 dark:shadow-[0_0_12px_rgba(244,114,182,0.35)]";
    case "teamleader":
    case "1":
      return "bg-red-500/15 text-red-800 dark:bg-yellow-400/20 dark:text-yellow-300 border-red-600/30 dark:border-yellow-400/80 dark:shadow-[0_0_12px_rgba(250,204,21,0.35)]";
    case "supportagent":
    case "2":
      // 🌟 LIGHT MODE: Zümrüt (Teal) | DARK MODE: Leylak (Purple)
      return "bg-teal-500/15 text-teal-800 border-teal-600/30 dark:bg-purple-500/25 dark:text-purple-300 dark:border-purple-400/70 dark:shadow-[0_0_12px_rgba(168,85,247,0.35)]";
    default:
      return "bg-stone-900/10 text-stone-900 dark:bg-slate-100/15 dark:text-slate-100 border-stone-900/25 dark:border-slate-100/30";
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
      <div className="flex min-h-screen items-center justify-center bg-sky-50/70 dark:bg-slate-950 text-stone-800 dark:text-slate-100 transition-colors">
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
    <div className="relative min-h-screen bg-sky-50/70 dark:bg-slate-950 text-stone-800 dark:text-slate-100 flex flex-col transition-colors overflow-hidden">
      {/* 🌟 Arka Plan Dekoru */}
      <BackgroundDecorations />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-sky-900/10 dark:border-purple-900/30 bg-sky-100/70 dark:bg-slate-900/70 backdrop-blur-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Archipelago Alanı */}
          <div className="flex items-center gap-3">
            <Link
              href="/tickets"
              className="group inline-flex items-center gap-3 text-lg font-bold tracking-tight transition-all"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-teal-600 to-emerald-600 dark:from-purple-600 dark:via-violet-600 dark:to-indigo-500 text-white shadow-lg shadow-teal-600/20 dark:shadow-purple-500/25 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <svg
                  className="h-6 w-6 text-white drop-shadow-md relative z-10"
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
                  <path d="M15 10c2-3-4-3 6-1" />
                  <path d="M15 10c0-3 2-5 4-5" />
                  <path d="M15 10c-2-3-4-3-5-5" />
                </svg>
              </div>

              {/* Modern Sans Font ve Akan Renksel Animasyon */}
              <div className="flex flex-col leading-none">
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  style={{
                    backgroundImage:
                      "linear-gradient(270deg, #d97706, #059669, #0d9488, #7c3aed, #d97706)",
                    backgroundSize: "300% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  className="font-sans font-black text-base tracking-tight uppercase"
                >
                  ARCHIPELAGO
                </motion.span>
                <span className="text-[10px] font-extrabold tracking-[0.25em] text-stone-400 dark:text-purple-300/60 uppercase mt-0.5">
                  HelpDesk
                </span>
              </div>
            </Link>
          </div>

          {/* Navigasyon Linkleri */}
          <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl border border-sky-200/60 dark:border-purple-900/40 bg-sky-200/40 dark:bg-slate-900/80 backdrop-blur-xl shadow-inner relative">
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
          <div className="flex items-center gap-3 z-10">
            <NotificationBell />

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2.5 rounded-2xl border border-sky-200/80 dark:border-purple-800/40 bg-white/80 dark:bg-slate-900/90 p-1.5 pr-3.5 hover:border-emerald-600/40 dark:hover:border-purple-500/50 hover:bg-white dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm group"
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
                          ? "bg-red-500/15 text-red-800 dark:bg-yellow-400/20 dark:text-yellow-300 font-bold"
                          : "text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <Settings className="h-4 w-4 text-red-600 dark:text-yellow-400" />
                      <span>Management Page</span>
                    </Link>
                  </li>
                )}

                {user?.role === "SupportAgent" && (
                  <li>
                    {/* 🌟 LIGHT MODE: Zümrüt (Teal) | DARK MODE: Leylak (Purple) */}
                    <Link
                      aria-current={isMyWorkPage ? "page" : undefined}
                      href="/tickets/my-work"
                      className={`flex items-center gap-2.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                        isMyWorkPage
                          ? "bg-teal-500/15 text-teal-800 dark:bg-purple-500/25 dark:text-purple-300 font-bold"
                          : "text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <Briefcase className="h-4 w-4 text-teal-600 dark:text-purple-400" />
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
          className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}