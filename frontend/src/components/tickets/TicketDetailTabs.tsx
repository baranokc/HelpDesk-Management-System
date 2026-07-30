"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Tabs, type TabItem } from "@/src/components/ui/Tabs";

type TicketTab = "comments" | "attachments" | "history";

interface TicketDetailTabsProps {
  comments: ReactNode;
  attachments: ReactNode;
  history: ReactNode;
  commentCount?: number;
  attachmentCount?: number;
  initialTab?: TicketTab;
}

export function TicketDetailTabs({
  comments,
  attachments,
  history,
  commentCount,
  attachmentCount,
  initialTab = "comments",
}: TicketDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TicketTab>(initialTab);
  const tabs: TabItem<TicketTab>[] = [
    {
      id: "comments",
      label: "Yorumlar",
      content: comments,
      badge: commentCount,
    },
    {
      id: "attachments",
      label: "Dosyalar",
      content: attachments,
      badge: attachmentCount,
    },
    {
      id: "history",
      label: "Geçmiş",
      content: history,
    },
  ];

  return <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />;
}
