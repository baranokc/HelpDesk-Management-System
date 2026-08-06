"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage system configurations, access rights, and global metrics.
          </p>
        </div>

        <button
          onClick={() => void fetchStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 self-start sm:self-auto"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : stats?.totalUsers ?? 0}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {loading ? "Loading..." : `+${stats?.usersThisWeek ?? 0} this week`}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
        </div>

        {/* Active Teams */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Teams
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : stats?.activeTeams ?? 0}
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Support & Dev teams
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Categories */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Categories
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : stats?.categoriesCount ?? 0}
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {loading ? "Loading..." : `${stats?.subcategoriesCount ?? 0} Subcategories`}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* System Status */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              System Status
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isHealthy 
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
            }`}>
              {isHealthy ? <SaveCheck className="h-5 w-5" /> : <ServerOff className="h-5 w-5" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
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
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              API & DB Connected
            </p>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isHealthy ? "bg-emerald-500" : "bg-rose-500"}`} />
        </div>
      </div>

      {/* MANAGEMENT HUB */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Management Hub
          </h2>
          <span className="text-xs text-slate-400 font-medium">Quick administrative actions</span>
        </div>
        
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* User Management */}
          <Link
            href="/admin/users"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/50 dark:hover:shadow-indigo-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <UserCheck className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Access Control
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  User Management
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Assign roles (Admin, Support Agent, Member), reset credentials, and control platform permissions.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Manage Accounts</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Support Teams */}
          <Link
            href="/admin/teams"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500/50 dark:hover:shadow-blue-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/10 dark:text-blue-400">
                  <Shield className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  Operations
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  Support Teams
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Structure support units, appoint Team Leaders, and manage routing rules for ticket distribution.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Configure Teams</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* CSAT Analytics */}
          <Link
            href="/admin/csat"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-amber-500/50 dark:hover:shadow-amber-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/10 dark:text-amber-400">
                  <Award className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  Quality
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                  CSAT Analytics
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  View customer satisfaction ratings, team averages, and communication/solution breakdown scores.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>View CSAT Reports</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Categories & Tags */}
          <Link
            href="/admin/categories"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-500/50 dark:hover:shadow-emerald-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <FolderTree className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  Taxonomy
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                  Categories & Tags
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Organize issue types, set up subcategories, and customize labels for ticket categorization.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Manage Categories</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* FAQ Management */}
          <Link
            href="/admin/faq"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-purple-500/50 dark:hover:shadow-purple-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-500/10 dark:text-purple-400">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                  Knowledge Base
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                  FAQ Management
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Publish help articles, update questions, and drag-and-drop to reorder items for end users.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>Edit Knowledge Base</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          {/* Audit Logs */}
          <Link
            href="/admin/audit-logs"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-500/50 hover:shadow-lg hover:shadow-slate-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-500/50 dark:hover:shadow-slate-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800 dark:text-slate-300">
                  <History className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Security & Audit
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-slate-600 dark:text-white dark:group-hover:text-slate-300">
                  Audit Logs
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inspect real-time activity trails, export change histories to Excel, and review security logs.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>View Audit Trail</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}