"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Shield, 
  Tag, 
  Activity, 
  ArrowRight,
  UserCheck,
  FolderTree,
  SaveCheck,
  ServerOff
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<AdminStats>("/admin/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const isHealthy = stats?.systemStatus === "Healthy";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage system configurations, access rights, and global metrics.
        </p>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : stats?.totalUsers ?? 0}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              {loading ? "Loading..." : `+${stats?.usersThisWeek ?? 0} this week`}
            </p>
          </div>
        </div>

        {/* Active Teams */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Teams
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : stats?.activeTeams ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Support & Dev teams
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Categories
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : stats?.categoriesCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {loading ? "Loading..." : `${stats?.subcategoriesCount ?? 0} Subcategories`}
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
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
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              API & DB Connected
            </p>
          </div>
        </div>
      </div>

      {/* HIZLI ERİŞİM KARTLARI */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* User Management */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                User Management
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Assign roles (Admin, Staff, Customer) and manage permissions.
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <Link
              href="/admin/users"
              className="group flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Manage Users
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Support Teams */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Support Teams
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Create resolution teams and assign agents to specific groups.
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <Link
              href="/admin/teams"
              className="group flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Manage Teams
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Categories & Tags */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Categories & Tags
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Configure ticket categories for better routing and assignment.
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <Link
              href="/admin/categories"
              className="group flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Manage Categories
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}