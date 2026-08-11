"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Users, ShieldCheck, UserCheck, ShieldAlert, 
  Search, RotateCw, Trash2, Mail, UserX
} from "lucide-react";
import { api, getApiErrorMessage } from "@/src/lib/api";
import { userService } from "@/src/services/userService";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: unknown;
  avatarUrl?: string | null;
  profilePictureUrl?: string | null;
}

const normalizeRole = (roleData: unknown): string => {
  if (!roleData) return "User";

  let roleValue: string;
  if (typeof roleData === "object") {
    const roleRecord = roleData as Record<string, unknown>;
    const roleName = roleRecord.name ?? roleRecord.Name;
    roleValue = typeof roleName === "string" ? roleName.trim() : "User";
  } else {
    roleValue = String(roleData).trim();
  }
  
  const lowerR = roleValue.toLowerCase();
  if (lowerR === "0" || lowerR === "admin") return "Admin";
  if (lowerR === "1" || lowerR === "teamleader") return "TeamLeader";
  if (lowerR === "2" || lowerR === "supportagent") return "SupportAgent";
  if (lowerR === "3" || lowerR === "user") return "User";
  return roleValue;
};

// Akıllı Profil Resmi Bileşeni (Light: Yeşil/Amber | Dark: Elektrik Mor/Eflatun)
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-600 dark:from-indigo-500 dark:via-indigo-600 dark:to-purple-600 text-xs font-black text-white shadow-sm ring-1 ring-stone-200 dark:ring-slate-700/80">
        {getInitials(fullName)}
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={fullName}
      onError={() => setHasError(true)}
      className="h-9 w-9 shrink-0 rounded-full object-cover border border-stone-200 dark:border-slate-700 shadow-sm"
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
    const initialLoadTimer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(initialLoadTimer);
  }, []);

  const handleRoleChange = async (targetUser: UserDto, newRoleString: string) => {
    const currentNormRole = normalizeRole(targetUser.role);
    if (currentNormRole === newRoleString) return;

    setUpdatingUserId(targetUser.id);
    setError(null);
    setSuccessMsg(null);

    try {
      await userService.updateUserRole({
        userId: targetUser.id,
        newRole: newRoleString,
      });
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

  const renderRoleBadge = (roleRaw: unknown) => {
    const role = normalizeRole(roleRaw);
    switch (role) {
      case "Admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-pink-500/20 dark:text-pink-300 border border-amber-300 dark:border-pink-500/40 px-3 py-1 text-xs font-bold">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-700 dark:text-pink-300" />
            Admin
          </span>
        );
      case "TeamLeader":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 dark:bg-yellow-500/20 dark:text-yellow-300 border border-red-200 dark:border-yellow-500/40 px-3 py-1 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-red-600 dark:text-yellow-400" />
            Team Leader
          </span>
        );
      case "SupportAgent":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 px-3 py-1 text-xs font-bold">
            <UserCheck className="h-3.5 w-3.5 text-teal-700 dark:text-purple-400" />
            Support Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200/70 text-stone-700 border border-stone-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-bold">
            <Users className="h-3.5 w-3.5 text-stone-600 dark:text-slate-300" />
            User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* ÜST BİLGİ VE REFRESH */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Manage access roles. Team leaders are appointed from Team Management.
          </p>
        </div>

        <button
          onClick={() => void fetchUsers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-sm transition-all hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600 dark:text-pink-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">Total Users</span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-purple-500/20 text-emerald-700 dark:text-purple-300 border border-emerald-500/20 dark:border-purple-500/30">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">Administrators</span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{stats.admins}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-pink-500/20 text-amber-800 dark:text-pink-300 border border-amber-600/30 dark:border-pink-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">Support Staff</span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{stats.support}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-800 border-teal-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">Standard Users</span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{stats.standardUsers}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900/10 dark:bg-slate-100/15 text-stone-900 dark:text-slate-100 border border-stone-900/20 dark:border-slate-100/30">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* ARAMA VE FİLTRE BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-stone-200/80 dark:border-purple-900/40 shadow-xl backdrop-blur-2xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 text-xs pl-9 pr-3 py-2 font-medium focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-slate-500" />
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 text-stone-800 dark:text-slate-200 text-xs px-3 py-2 font-bold focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="TeamLeader">Team Leader</option>
            <option value="SupportAgent">Support Agent</option>
            <option value="User">User</option>
          </select>
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
            Showing: <b className="text-stone-800 dark:text-slate-200">{filteredUsers.length}</b> / {users.length}
          </span>
        </div>
      </div>

      {/* KULLANICI TABLOSU */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Loading users list..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserX className="h-10 w-10 mx-auto text-stone-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-stone-600 dark:text-slate-400">No users match your criteria.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[700px]">
              <thead className="bg-stone-50/80 dark:bg-slate-800/50 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-slate-800">
                <tr>
                  {/* 🌟 YENİ ORANLAR: Çöp kovasını yakınlaştırmak için Actions yazısı silindi ve sola çekildi */}
                  <th className="px-5 py-3.5 w-[30%]">User</th>
                  <th className="px-5 py-3.5 w-[28%]">Email</th>
                  <th className="px-5 py-3.5 w-[18%]">Current Role</th>
                  <th className="pl-6 pr-2 py-3.5 w-[18%]">Change Role</th>
                  <th className="pr-5 pl-2 py-3.5 w-[6%] text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-medium">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isUpdating = updatingUserId === u.id;
                  const currentNormRole = normalizeRole(u.role);
                  const avatarSrc = u.avatarUrl || u.profilePictureUrl;

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar avatarSrc={avatarSrc} fullName={u.fullName} />
                          <div className="min-w-0 truncate">
                            <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{u.fullName}</span>
                              {isSelf && (
                                <span className="rounded bg-emerald-500/10 dark:bg-purple-500/20 text-emerald-800 dark:text-purple-300 text-[9px] font-black px-1.5 py-0.5 border border-emerald-600/20 dark:border-purple-500/30 uppercase shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-stone-600 dark:text-slate-400 truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-slate-500" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">{renderRoleBadge(u.role)}</td>

                      {/* 🌟 DEĞİŞİKLİK: Select kutusunun padding ayarları daraltıldı */}
                      <td className="pl-6 pr-2 py-3.5">
                        <select
                          value={currentNormRole}
                          disabled={isSelf || isUpdating}
                          onChange={(e) => void handleRoleChange(u, e.target.value)}
                          className="w-full truncate rounded-xl border border-stone-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-stone-800 dark:text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="Admin">Admin</option>
                          <option value="TeamLeader" disabled={currentNormRole !== "TeamLeader"}>
                            Team Leader
                          </option>
                          <option value="SupportAgent">Support Agent</option>
                          <option value="User">User</option>
                        </select>
                      </td>

                      {/* 🌟 DEĞİŞİKLİK: Çöp kovası sola hizalanarak (text-center/left) Change Role'a yanaştırıldı */}
                      <td className="pr-5 pl-2 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setUserToDelete(u)}
                          disabled={isSelf || isUpdating}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 cursor-pointer"
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