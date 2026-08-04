"use client";

import { useEffect, useState, useMemo } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { userService } from "@/src/services/userService";
import type { UserListDto } from "@/src/types/user";

type UserListFallbackFields = {
  name?: string;
  lastName?: string;
  userName?: string;
};

// SVG Ikonlar
const RefreshIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const SunIcon = () => (
  <svg
    className="w-4 h-4 text-amber-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="w-4 h-4 text-slate-300"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const getRoleName = (role: unknown): string => {
  if (!role) return "User";
  if (typeof role === "object" && role !== null && "name" in role) {
    return String((role as { name: string }).name);
  }
  return String(role);
};

// Rol Öncelik Sıralaması: Admin (1) -> TeamLeader (2) -> SupportAgent (3) -> User (4)
const getRolePriority = (role: unknown): number => {
  const roleName = getRoleName(role);
  if (roleName === "Admin") return 1;
  if (roleName === "TeamLeader") return 2;
  if (roleName === "SupportAgent") return 3;
  return 4;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const themeSyncTimer = window.setTimeout(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    }, 0);

    return () => window.clearTimeout(themeSyncTimer);
  }, []);

  const toggleTheme = () => {
    const newDarkState = !isDarkMode;
    setIsDarkMode(newDarkState);
    if (newDarkState) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load users from database."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(initialLoadTimer);
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setError(null);
    try {
      await userService.updateUserRole({ userId, newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: unknown) {
      console.error("Role update failed:", err);
      setError(getApiErrorMessage(err, "Failed to update user role."));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const rawUser = u as UserListDto & UserListFallbackFields;
        const roleName = getRoleName(u.role);

        const displayName = (
          u.fullName ||
          (rawUser.name && rawUser.lastName
            ? `${rawUser.name} ${rawUser.lastName}`
            : null) ||
          rawUser.name ||
          rawUser.userName ||
          u.email?.split("@")[0] ||
          "User"
        ).toLowerCase();

        const email = (u.email || "").toLowerCase();
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
          displayName.includes(search) || email.includes(search);
        const matchesRole =
          selectedRoleFilter === "ALL" || roleName === selectedRoleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        // Öncelik 1: Admin -> SupportAgent -> User sıralaması
        const priorityA = getRolePriority(a.role);
        const priorityB = getRolePriority(b.role);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Öncelik 2: Aynı roldeki kullanıcıları kendi arasında isme göre alfabetik sıralama
        const nameA = (a.fullName || a.email || "").toLowerCase();
        const nameB = (b.fullName || b.email || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [users, searchTerm, selectedRoleFilter]);

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case "Admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "TeamLeader":
        return "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800";
      case "SupportAgent":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live database users — manage access permissions and roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm focus:outline-none"
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            onClick={() => void loadUsers()}
            className="btn btn-sm btn-ghost border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs pl-8 focus:outline-none focus:border-blue-500"
          />
          <span className="absolute left-2.5 top-2.5">
            <SearchIcon />
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="select select-sm select-bordered bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="TeamLeader">Team Leader</option>
            <option value="SupportAgent">Support Agent</option>
            <option value="User">User</option>
          </select>

          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Showing: <b>{filteredUsers.length}</b> / {users.length}
          </span>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner label="Fetching users from database..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {users.length === 0
              ? "No users found in database."
              : "No users match your search and filter criteria."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredUsers.map((u) => {
                  const roleName = getRoleName(u.role);
                  const rawUser = u as UserListDto & UserListFallbackFields;
                  const displayName =
                    u.fullName ||
                    (rawUser.name && rawUser.lastName
                      ? `${rawUser.name} ${rawUser.lastName}`
                      : null) ||
                    rawUser.name ||
                    rawUser.userName ||
                    u.email?.split("@")[0] ||
                    "User";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="font-semibold text-slate-900 dark:text-white">
                        {displayName}
                      </td>
                      <td className="text-slate-500 dark:text-slate-400">
                        {u.email}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(
                            roleName
                          )}`}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="text-right">
                        <select
                          disabled={updatingUserId === u.id}
                          value={roleName}
                          onChange={(e) =>
                            void handleRoleChange(u.id, e.target.value)
                          }
                          className="select select-sm select-bordered bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs disabled:opacity-50"
                        >
                          <option value="Admin">Admin</option>
                          <option value="TeamLeader">TeamLeader</option>
                          <option value="SupportAgent">SupportAgent</option>
                          <option value="User">User</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
