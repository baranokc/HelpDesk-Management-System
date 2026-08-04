"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LinkButton } from "@/src/components/ui/Button";
import { NotificationBell } from "@/src/components/ui/NotificationBell";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { useAuth } from "@/src/context/AuthContext";
import { getTicketViewLabel } from "@/src/lib/ticketPermissions";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const viewLabel = getTicketViewLabel(user?.role);
  const isCreateTicketPage = pathname === "/tickets/new";
  const isTicketsSection = pathname.startsWith("/tickets") && !isCreateTicketPage;
  const isTeamManagementPage = pathname.startsWith("/tickets/team-management",);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = () => {
    logout();
  };

  const userObj = user as unknown as {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };

  const fullNameFromParts =
    userObj?.firstName || userObj?.lastName
      ? `${userObj.firstName ?? ""} ${userObj.lastName ?? ""}`.trim()
      : null;

  const displayName =
    fullNameFromParts ||
    userObj?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const userRole = user?.role || "Member";

  const avatarInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-2">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand / Logo */}
          <div className="flex-1">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-content font-black text-sm">
                HD
              </div>
              <span>HelpDesk</span>
            </Link>
          </div>

          {/* Navigation Links */}
<div className="hidden md:flex items-center gap-2 mr-4">
  <LinkButton
    href="/tickets"
    size="sm"
    variant={isTicketsSection ? "primary" : "secondary"}
    className={`text-sm font-medium normal-case transition-all ${
      !isTicketsSection
        ? "dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:!bg-slate-900 hover:!text-white dark:hover:!bg-white dark:hover:!text-slate-900"
        : ""
    }`}
  >
    {viewLabel.navigationLabel}
  </LinkButton>

  <LinkButton
    href="/tickets/new"
    size="sm"
    variant={isCreateTicketPage ? "primary" : "secondary"}
    className={`text-sm font-medium normal-case transition-all ${
      !isCreateTicketPage
        ? "dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:!bg-slate-900 hover:!text-white dark:hover:!bg-white dark:hover:!text-slate-900"
        : ""
    }`}
  >
    Create Ticket
  </LinkButton>
</div>

          {/* User Actions */}
          <div className="flex-none gap-3 flex items-center">
            {/* Notifications */}
            <NotificationBell />

            {/* KULLANICI PROFİL MENÜSÜ */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 pr-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {/* Avatar Dairesi */}
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-bold text-xs text-white shadow-sm">
                  {avatarInitials}
                </div>

                {/* Kullanıcı Adı & Rolü */}
                <div className="hidden sm:flex flex-col text-left max-w-[120px]">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 leading-tight capitalize">
                    {userRole}
                  </span>
                </div>

                {/* Ok İkonu */}
                <svg
                  className="h-4 w-4 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Açılır Menü İçeriği */}
              <ul
                tabIndex={0}
                className="dropdown-content menu z-[1] mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl"
              >
                {/* Mail Bölümü */}
                <li className="menu-title border-b border-slate-100 dark:border-slate-800 pb-2 mb-1 px-3">
                  <span
                    className="text-xs font-bold text-slate-900 dark:text-white normal-case p-0 truncate block max-w-full"
                    title={user?.email}
                  >
                    {user?.email}
                  </span>
                </li>

                {/* Profil Butonu */}
  <li>
    <button
      type="button"
      onClick={(e) => e.preventDefault()}
      className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg py-2"
    >
      <svg
        className="h-4 w-4 text-slate-500 dark:text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      Profile
    </button>
  </li>

  {/* 🛡️ ADMIN PANEL BUTONU (SADECE ADMIN VE SUPPORT AGENT İÇİN) */}
  {(user?.role === "Admin" || user?.role === "SupportAgent") && (
    <li>
      <Link
        href="/admin"
        className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg py-2"
      >
        <svg
          className="h-4 w-4 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        Admin Panel
      </Link>
    </li>
  )}
                  {user?.role === "TeamLeader" && (
                  <li>
                    <Link
                      aria-current={
                        isTeamManagementPage ? "page" : undefined
                      }
                      href="/tickets/team-management"
                      className={`flex items-center gap-2 rounded-lg py-2 text-xs font-semibold ${
                        isTeamManagementPage
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-4 text-center text-base leading-none text-slate-500 dark:text-slate-400"
                      >
                        ⚙
                      </span>
                      Management Page
                    </Link>
                  </li>
                )}

  {/* Sign Out Butonu */}
  <li>
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 rounded-lg py-2"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Sign Out
    </button>
  </li>
</ul>
            </div>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
