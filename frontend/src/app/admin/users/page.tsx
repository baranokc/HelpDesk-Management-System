"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Users, ShieldCheck, UserCheck, ShieldAlert, 
  Search, RotateCw, Trash2, Mail, UserX
} from "lucide-react";
import { api, getApiErrorMessage } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: any;
  avatarUrl?: string | null;
  profilePictureUrl?: string | null;
}

const normalizeRole = (roleData: any): string => {
  if (!roleData) return "User";
  let r = typeof roleData === 'object' ? (roleData.name || roleData.Name || "User") : String(roleData).trim();
  
  const lowerR = r.toLowerCase();
  if (lowerR === "0" || lowerR === "admin") return "Admin";
  if (lowerR === "1" || lowerR === "teamleader") return "TeamLeader";
  if (lowerR === "2" || lowerR === "supportagent") return "SupportAgent";
  if (lowerR === "3" || lowerR === "user") return "User";
  return r;
};

// Akıllı Profil Resmi Bileşeni (Light & Dark Uyumlu)
function UserAvatar({ avatarSrc, fullName }: { avatarSrc?: string | null; fullName: string }) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  };

  const getFullImageUrl = (src: string | null | undefined) => {
    if (!src) return null;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      return src;
    }
    const baseURL = api.defaults.baseURL || "http://localhost:5269/api";
    const cleanBase = baseURL.replace(/\/api\/?$/, "");
    const cleanSrc = src.startsWith("/") ? src : `/${src}`;
    return `${cleanBase}${cleanSrc}`;
  };

  const finalSrc = getFullImageUrl(avatarSrc);

  if (!finalSrc || hasError) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/80">
        {getInitials(fullName)}
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={fullName}
      onError={() => setHasError(true)}
      className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
    />
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<UserDto[]>("/admin/users");
      setUsers(response.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load users from database."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleRoleChange = async (targetUser: UserDto, newRoleString: string) => {
    const currentNormRole = normalizeRole(targetUser.role);
    if (currentNormRole === newRoleString) return;

    setUpdatingUserId(targetUser.id);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.put(`/admin/users/${targetUser.id}/role`, { role: newRoleString });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRoleString } : u))
      );
      setSuccessMsg(`Role for ${targetUser.fullName} updated to "${newRoleString}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update user role."));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSuccessMsg(`User "${userToDelete.fullName}" has been permanently removed.`);
      setUserToDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete user."));
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => normalizeRole(u.role) === "Admin").length;
    const support = users.filter((u) => {
      const r = normalizeRole(u.role);
      return r === "SupportAgent" || r === "TeamLeader";
    }).length;
    const standardUsers = users.filter((u) => normalizeRole(u.role) === "User").length;
    return { total, admins, support, standardUsers };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const rolePriority: Record<string, number> = {
      Admin: 1,
      TeamLeader: 2,
      SupportAgent: 3,
      User: 4,
    };

    const filtered = users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const normRole = normalizeRole(u.role);
      const matchesRole = roleFilter === "ALL" || normRole === roleFilter;
      return matchesSearch && matchesRole;
    });

    return filtered.sort((a, b) => {
      const roleA = normalizeRole(a.role);
      const roleB = normalizeRole(b.role);
      const pA = rolePriority[roleA] || 99;
      const pB = rolePriority[roleB] || 99;
      return pA - pB;
    });
  }, [users, searchTerm, roleFilter]);

  const renderRoleBadge = (roleRaw: any) => {
    const role = normalizeRole(roleRaw);
    switch (role) {
      case "Admin":
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
            <ShieldAlert className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Admin
          </span>
        );
      case "TeamLeader":
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
            <ShieldCheck className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            Team Leader
          </span>
        );
      case "SupportAgent":
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
            <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Support Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ÜST BİLGİ VE REFRESH */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage access roles. Team leaders are appointed from Team Management.
          </p>
        </div>

        <button
          onClick={() => void fetchUsers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Users</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Administrators</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.admins}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Support Staff</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.support}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Standard Users</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.standardUsers}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* ARAMA VE FİLTRE BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-3 py-2 font-semibold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="TeamLeader">Team Leader</option>
            <option value="SupportAgent">Support Agent</option>
            <option value="User">User</option>
          </select>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing: <b className="text-slate-800 dark:text-slate-200">{filteredUsers.length}</b> / {users.length}
          </span>
        </div>
      </div>

      {/* KULLANICI TABLOSU */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Loading users list..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserX className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No users match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Current Role</th>
                  <th className="px-6 py-3.5">Change Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isUpdating = updatingUserId === u.id;
                  const currentNormRole = normalizeRole(u.role);
                  const avatarSrc = u.avatarUrl || u.profilePictureUrl;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar avatarSrc={avatarSrc} fullName={u.fullName} />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isSelf && (
                                <span className="rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-1.5 py-0.5 border border-indigo-200 dark:border-indigo-800/80">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">{renderRoleBadge(u.role)}</td>

                      <td className="px-6 py-4">
                        <select
                          value={currentNormRole}
                          disabled={isSelf || isUpdating}
                          onChange={(e) => void handleRoleChange(u, e.target.value)}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="Admin">Admin</option>
                          <option value="TeamLeader" disabled={currentNormRole !== "TeamLeader"}>
                            TeamLeader (Team Management only)
                          </option>
                          <option value="SupportAgent">SupportAgent</option>
                          <option value="User">User</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setUserToDelete(u)}
                          disabled={isSelf || isUpdating}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!userToDelete}
        title="Delete User Account"
        description={`Are you sure you want to permanently delete "${userToDelete?.fullName}" (${userToDelete?.email})?`}
        confirmText="Yes, Delete User"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}