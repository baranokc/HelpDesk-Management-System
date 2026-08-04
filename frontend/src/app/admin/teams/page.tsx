"use client";

import { Card } from "@/src/components/ui/Card";

export default function TeamManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Team Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure support teams and agent groups.
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <p className="text-slate-600 dark:text-slate-300">
          Team configuration settings and group assignments will be listed here.
        </p>
      </Card>
    </div>
  );
}