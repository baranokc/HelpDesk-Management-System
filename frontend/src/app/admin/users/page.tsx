"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { userService } from "@/src/services/userService";
import type { UserListDto } from "@/src/types/user";

// Role verisi ister string ister nesne gelsin, güvenle role ismini dndüren yardımcı fonksiyon
const getRoleName = (role: unknown): string => {
  if (!role) return "Customer";
  if (typeof role === "object" && role !== null && "name" in role) {
    return String((role as { name: string }).name);
  }
  return String(role);
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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
    void loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await userService.updateUserRole({ userId, newRole });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          // Eğer role nesne olarak tutuluyorsa 'name' alanını, string ise direkt kendisini güncelliyoruz
          const updatedRole =
            typeof u.role === "object" && u.role !== null
              ? { ...(u.role as object), name: newRole }
              : newRole;
          return { ...u, role: updatedRole as any };
        })
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update user role."));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live database users — manage access permissions and roles.
          </p>
        </div>
        <button
          onClick={() => void loadUsers()}
          className="btn btn-sm btn-ghost border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          🔄 Refresh
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner label="Fetching users from database..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No users found in database.
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
                {users.map((u) => {
                  const roleName = getRoleName(u.role);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="font-semibold text-slate-900 dark:text-white">
                        {u.fullName}
                      </td>
                      <td className="text-slate-500 dark:text-slate-400">
                        {u.email}
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm font-semibold ${
                            roleName === "Admin"
                              ? "badge-primary text-white"
                              : roleName === "SupportAgent"
                              ? "badge-secondary text-white"
                              : "badge-ghost text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          }`}
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
                          <option value="Customer">Customer</option>
                          <option value="SupportAgent">SupportAgent</option>
                          <option value="Admin">Admin</option>
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