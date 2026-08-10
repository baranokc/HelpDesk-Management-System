"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Shield, 
  Tag, 
  ArrowUpRight,
  UserCheck,
  FolderTree,
  SaveCheck,
  ServerOff,
  HelpCircle,
  History,
  RotateCw,
  Award
} from "lucide-react";
import { api } from "@/src/lib/api";

interface AdminStats {
  totalUsers: number;
  usersThisWeek: number;
  activeTeams: number;
  categoriesCount: number;
  subcategoriesCount: number;
  systemStatus: string;
}

// Framer Motion Animasyon Varyantları (as const eklendi)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
} as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get<AdminStats>("/admin/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  const isHealthy = stats?.systemStatus === "Healthy";

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            Admin Overview
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Manage system configurations, access rights, and global metrics.
          </p>
        </div>

        <button
          onClick={() => void fetchStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300/80 bg-stone-100 px-3.5 py-2 text-xs font-bold text-stone-800 shadow-sm transition-all hover:border-emerald-600/40 hover:bg-stone-200 dark:border-purple-900/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-500/50 dark:hover:bg-slate-700 self-start sm:self-auto active:scale-95"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600 dark:text-pink-400" : ""}`} />
          <span>Refresh Stats</span>
        </button>
      </motion.div>

      {/* METRİK KARTLARI (SIRA SIRALANAN ANİMASYONLU GRID) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Users - Indigo / Pink */}
        <motion.div variants={cardVariants} className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-indigo-400 hover:shadow-indigo-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-pink-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-900/70 dark:text-slate-400">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-700 dark:bg-pink-500/20 dark:text-pink-300 border border-indigo-500/20 dark:border-pink-500/30">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-indigo-950 dark:text-white">
              {loading ? "..." : stats?.totalUsers ?? 0}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-pink-300">
              {loading ? "Loading..." : `+${stats?.usersThisWeek ?? 0} this week`}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-pink-500 dark:to-purple-500" />
        </motion.div>

        {/* Active Teams - Blue / Violet */}
        <motion.div variants={cardVariants} className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-blue-50/30 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-blue-400 hover:shadow-blue-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-indigo-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-900/70 dark:text-slate-400">
              Active Teams
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-blue-500/20 dark:border-indigo-500/30">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-blue-950 dark:text-white">
              {loading ? "..." : stats?.activeTeams ?? 0}
            </div>
            <p className="mt-1 text-xs font-semibold text-blue-800/80 dark:text-slate-400">
              Support & Dev units
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-teal-500 dark:from-indigo-500 dark:to-violet-500" />
        </motion.div>

        {/* Categories - Amber */}
        <motion.div variants={cardVariants} className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-amber-400 hover:shadow-amber-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-amber-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900/70 dark:text-slate-400">
              Categories
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-950 dark:text-white">
              {loading ? "..." : stats?.categoriesCount ?? 0}
            </div>
            <p className="mt-1 text-xs font-semibold text-amber-800/80 dark:text-slate-400">
              {loading ? "Loading..." : `${stats?.subcategoriesCount ?? 0} Subcategories`}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </motion.div>

        {/* System Status - Emerald / Rose */}
        <motion.div variants={cardVariants} className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-emerald-400 hover:shadow-emerald-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-purple-500/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900/70 dark:text-slate-400">
              System Status
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isHealthy 
                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
            }`}>
              {isHealthy ? <SaveCheck className="h-4 w-4" /> : <ServerOff className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-emerald-950 dark:text-white">
                {loading ? "..." : (stats?.systemStatus ?? "Unknown")}
              </span>
              {!loading && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    isHealthy ? "bg-emerald-400" : "bg-rose-400"
                  }`}></span>
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isHealthy ? "bg-emerald-500" : "bg-rose-500"
                  }`}></span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-800/80 dark:text-slate-400">
              API & DB Connected
            </p>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isHealthy ? "bg-emerald-500" : "bg-rose-500"}`} />
        </motion.div>
      </motion.div>

      {/* MANAGEMENT HUB (ANİMASYONLU GRID) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 font-mono">
            Management Hub
          </h2>
          <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">Quick administrative actions</span>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* User Management - Indigo/Pink */}
          <motion.div variants={cardVariants}>
            <Link
              href="/admin/users"
              className="group relative flex flex-col justify-between h-full rounded-3xl border border-indigo-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-indigo-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-pink-500/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-pink-500/20 dark:text-pink-300 transition-transform duration-300 group-hover:scale-110 border border-indigo-500/20 dark:border-pink-500/30">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-pink-500/20 dark:text-pink-300 border border-indigo-500/20 dark:border-pink-500/30 font-mono">
                    Access Control
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-indigo-950 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-pink-300">
                    User Management
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                    Assign roles (Admin, Support Agent, Member), reset credentials, and control platform permissions.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-pink-300">
                <span>Manage Accounts</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </motion.div>

          {/* Support Teams - Blue/Violet */}
          <motion.div variants={cardVariants}>
            <Link
              href="/admin/teams"
              className="group relative flex flex-col justify-between h-full rounded-3xl border border-blue-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-blue-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-purple-500/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-indigo-500/20 dark:text-indigo-300 transition-transform duration-300 group-hover:scale-110 border border-blue-500/20 dark:border-indigo-500/30">
                    <Shield className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-blue-500/20 dark:border-indigo-500/30 font-mono">
                    Operations
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-blue-950 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-indigo-300">
                    Support Teams
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                    Structure support units, appoint Team Leaders, and manage routing rules for ticket distribution.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-indigo-300">
                <span>Configure Teams</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </motion.div>

          {/* CSAT Analytics - Amber */}
          <motion.div variants={cardVariants}>
            <Link
              href="/admin/csat"
              className="group relative flex flex-col justify-between h-full rounded-3xl border border-amber-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-amber-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-amber-500/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 transition-transform duration-300 group-hover:scale-110 border border-amber-500/20 dark:border-amber-500/30">
                    <Award className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30 font-mono">
                    Quality
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-amber-950 transition-colors group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-300">
                    CSAT Analytics
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                    View customer satisfaction ratings, team averages, and communication/solution breakdown scores.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                <span>View CSAT Reports</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </motion.div>

          {/* Categories & Tags - Emerald */}
          <motion.div variants={cardVariants}>
            <Link
              href="/admin/categories"
              className="group relative flex flex-col justify-between h-full rounded-3xl border border-emerald-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-emerald-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-emerald-500/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 transition-transform duration-300 group-hover:scale-110 border border-emerald-500/20 dark:border-emerald-500/30">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30 font-mono">
                    Taxonomy
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-emerald-950 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-300">
                    Categories & Tags
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                    Organize issue types, set up subcategories, and customize labels for ticket categorization.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                <span>Manage Categories</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </motion.div>

          {/* FAQ Management - Purple/Violet */}
          <motion.div variants={cardVariants}>
            <Link
              href="/admin/faq"
              className="group relative flex flex-col justify-between h-full rounded-3xl border border-purple-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/60 hover:shadow-purple-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-purple-500/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 transition-transform duration-300 group-hover:scale-110 border border-purple-500/20 dark:border-purple-500/30">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30 font-mono">
                    Knowledge Base
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-purple-950 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-300">
                    FAQ Management
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                    Publish help articles, update questions, and drag-and-drop to reorder items for end users.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-300">
                <span>Edit Knowledge Base</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </motion.div>

          {/* Audit Logs - Slate */}
          <motion.div variants={cardVariants}>
            <Link
              href="/admin/audit-logs"
              className="group relative flex flex-col justify-between h-full rounded-3xl border border-stone-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-stone-400 hover:shadow-stone-500/10 dark:border-purple-900/40 dark:bg-slate-900/80 dark:hover:border-slate-600"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                    <History className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-200 dark:border-slate-700 font-mono">
                    Security & Audit
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-stone-900 transition-colors group-hover:text-stone-700 dark:text-white dark:group-hover:text-slate-300">
                    Audit Logs
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                    Inspect real-time activity trails, export change histories to Excel, and review security logs.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-slate-300">
                <span>View Audit Trail</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}