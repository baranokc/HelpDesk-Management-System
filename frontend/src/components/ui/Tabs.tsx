"use client";

import type { ReactNode } from "react";

export interface TabItem<TId extends string> {
  id: TId;
  label: string;
  content: ReactNode;
  badge?: number;
}

interface TabsProps<TId extends string> {
  tabs: TabItem<TId>[];
  activeTab: TId;
  onChange: (id: TId) => void;
}

export function Tabs<TId extends string>({
  tabs,
  activeTab,
  onChange,
}: TabsProps<TId>) {
  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div>
      <div className="tabs tabs-border" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={tab.id === activeTab}
            className={`tab gap-2 ${tab.id === activeTab ? "tab-active" : ""}`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
            {tab.badge != null && (
              <span className="badge badge-sm badge-ghost">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="pt-5" role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}
