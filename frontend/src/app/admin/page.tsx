"use client";

import Link from "next/link";
import { Card } from "@/src/components/ui/Card";

export default function AdminDashboardPage() {
  const stats = [
    { title: "Total Users", value: "48", desc: "+3 this week", icon: "👥" },
    { title: "Active Teams", value: "6", desc: "Support & Dev teams", icon: "🛡️" },
    { title: "Categories", value: "12", desc: "32 Subcategories", icon: "🏷️" },
    { title: "System Status", value: "Healthy", desc: "API & DB Connected", icon: "🟢" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Admin Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage system configurations, access rights, and global metrics.
        </p>
      </div>

      {/* STATS KARTLARI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {stat.title}
              </span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {stat.value}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {stat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* HIZLI ERİŞİM KARTLARI */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card title="User Management" description="Assign roles (Admin, Staff, Customer) and manage permissions.">
          <Link
            href="/admin/users"
            className="btn btn-sm btn-outline dark:border-slate-700 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900 mt-4 w-full"
          >
            Manage Users →
          </Link>
        </Card>

        <Card title="Support Teams" description="Create resolution teams and assign agents to specific groups.">
          <Link
            href="/admin/teams"
            className="btn btn-sm btn-outline dark:border-slate-700 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900 mt-4 w-full"
          >
            Manage Teams →
          </Link>
        </Card>

        <Card title="Categories & Tags" description="Configure ticket categories for better routing and assignment.">
          <Link
            href="/admin/categories"
            className="btn btn-sm btn-outline dark:border-slate-700 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900 mt-4 w-full"
          >
            Manage Categories →
          </Link>
        </Card>
      </div>
    </div>
  );
}