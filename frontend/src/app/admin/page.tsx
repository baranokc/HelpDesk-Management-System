"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  const statCards = [
    {
      title: "Total Users",
      value: loading ? "..." : stats?.totalUsers.toString() ?? "0",
      desc: loading ? "Loading..." : `+${stats?.usersThisWeek ?? 0} this week`,
      icon: "👥",
    },
    {
      title: "Active Teams",
      value: loading ? "..." : stats?.activeTeams.toString() ?? "0",
      desc: "Support & Dev teams",
      icon: "🛡️",
    },
    {
      title: "Categories",
      value: loading ? "..." : stats?.categoriesCount.toString() ?? "0",
      desc: loading ? "Loading..." : `${stats?.subcategoriesCount ?? 0} Subcategories`,
      icon: "🏷️",
    },
    {
      title: "System Status",
      value: loading ? "..." : stats?.systemStatus ?? "Unknown",
      desc: "API & DB Connected",
      icon: stats?.systemStatus === "Healthy" ? "🟢" : "🔴",
    },
  ];

  const quickAccess = [
    {
      title: "User Management",
      description: "Assign roles (Admin, Staff, Customer) and manage permissions.",
      href: "/admin/users",
      buttonText: "Manage Users →",
    },
    {
      title: "Support Teams",
      description: "Create resolution teams and assign agents to specific groups.",
      href: "/admin/teams",
      buttonText: "Manage Teams →",
    },
    {
      title: "Categories & Tags",
      description: "Configure ticket categories for better routing and assignment.",
      href: "/admin/categories",
      buttonText: "Manage Categories →",
    },
  ];

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

      {/* CANLI STATS KARTLARI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {stat.title}
              </span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* HIZLI ERİŞİM KARTLARI */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {quickAccess.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
              <Link
                href={item.href}
                className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {item.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}