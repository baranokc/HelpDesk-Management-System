"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LinkButton } from "@/src/components/ui/Button";
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = () => {
    logout();
  };

  // 1. FIRSTNAME VE LASTNAME KONTROLÜ (Yoksa fullName, en son mail)
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

  // Baş harflerden avatar metni üret (örn: Süleyman Baran -> SB)
  const avatarInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-sm font-medium text-slate-500">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand / Logo */}
          <div className="flex-1">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 text-xl font-bold text-slate-900"
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
              variant={pathname === "/tickets" ? "primary" : "secondary"}
              className="text-sm font-medium normal-case"
            >
              {viewLabel.navigationLabel}
            </LinkButton>

            <LinkButton
              href="/tickets/new"
              size="sm"
              variant={pathname === "/tickets/new" ? "primary" : "secondary"}
              className="text-sm font-medium normal-case"
            >
              Create Ticket
            </LinkButton>
          </div>

          {/* User Actions */}
          <div className="flex-none gap-3 flex items-center">
            {/* Dark / Light Mode Toggle */}
            <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
              <input
                type="checkbox"
                onChange={(e) => {
                  document.documentElement.setAttribute(
                    "data-theme",
                    e.target.checked ? "dark" : "light"
                  );
                }}
              />

              {/* Sun Icon (Light Mode) */}
              <svg
                className="swap-on h-5 w-5 fill-current text-slate-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>

              {/* Moon Icon (Dark Mode) */}
              <svg
                className="swap-off h-5 w-5 fill-current text-slate-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,10,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>

            {/* KULLANICI PROFİL MENÜSÜ */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-3 hover:bg-slate-50 transition cursor-pointer"
              >
                {/* Avatar Dairesi */}
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-bold text-xs text-white shadow-sm">
                  {avatarInitials}
                </div>

                {/* Kullanıcı Adı & Rolü */}
                <div className="hidden sm:flex flex-col text-left max-w-[120px]">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 leading-tight capitalize">
                    {userRole}
                  </span>
                </div>

                {/* Ok İkonu */}
                <svg
                  className="h-4 w-4 text-slate-400"
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
                className="dropdown-content menu z-[1] mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                {/* Mail Bölümü (Truncate ile Taşma Engellendi) */}
                <li className="menu-title border-b border-slate-100 pb-2 mb-1 px-3">
                  <span
                    className="text-xs font-bold text-slate-900 normal-case p-0 truncate block max-w-full"
                    title={user?.email}
                  >
                    {user?.email}
                  </span>
                </li>

                {/* ŞİMDİLİK BOŞ PROFİL İKONLU BUTON */}
                <li>
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg py-2"
                  >
                    <svg
                      className="h-4 w-4 text-slate-500"
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

                {/* Sign Out Butonu */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg py-2"
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