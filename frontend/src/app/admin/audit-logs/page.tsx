"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { api } from "@/src/lib/api";

export interface AuditLogDto {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityName: string;
  entityId?: string;
  ipAddress?: string;
  details?: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
}

// Inline SVG Ikonlar
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auditlogs");
      const data = response.data;

      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data && Array.isArray(data.items)) {
        setLogs(data.items);
      } else if (data && Array.isArray(data.$values)) {
        setLogs(data.$values);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAuditLogs();
  }, []);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await api.get("/auditlogs/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `AuditLogs_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Excel export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("ADD")) {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("REORDER")) {
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
    }
    if (act.includes("DELETE") || act.includes("REMOVE")) {
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    }
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  };

  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];

    return logs.filter((log) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        log.userEmail?.toLowerCase().includes(searchTerm) ||
        log.userName?.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        log.entityName.toLowerCase().includes(searchTerm) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm));

      const matchesAction =
        selectedActionFilter === "ALL" ||
        (selectedActionFilter === "CREATE" && log.action.toUpperCase().includes("CREATE")) ||
        (selectedActionFilter === "UPDATE" && log.action.toUpperCase().includes("UPDATE")) ||
        (selectedActionFilter === "DELETE" && log.action.toUpperCase().includes("DELETE"));

      return matchesSearch && matchesAction;
    });
  }, [logs, search, selectedActionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  return (
    <div className="space-y-5">
      {/* Sayfa Başlığı ve Sağ Butonlar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track user activities, security events, and system changes in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchAuditLogs()}
            className="btn btn-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => void handleExportExcel()}
            disabled={isExporting}
            className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none flex items-center gap-2 shadow-sm"
          >
            <DownloadIcon />
            <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {/* Yenilenmiş Audit Stat Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Events
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {Array.isArray(logs) ? logs.length : 0}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              LOGS
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-400 dark:bg-slate-700" />
        </div>

        {/* Creations */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-950/60 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Creations
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              +
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {Array.isArray(logs) ? logs.filter((l) => l.action.toUpperCase().includes("CREATE")).length : 0}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              CREATE
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Updates */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Updates
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              ✎
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
              {Array.isArray(logs) ? logs.filter((l) => l.action.toUpperCase().includes("UPDATE")).length : 0}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              UPDATE
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
        </div>

        {/* Deletions */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-100 dark:border-rose-950/60 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Deletions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold text-sm">
              🗑
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {Array.isArray(logs) ? logs.filter((l) => l.action.toUpperCase().includes("DELETE")).length : 0}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              DELETE
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* Tablo ve Kompakt Arama Barı Kapsayıcısı */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm rounded-2xl">
        {/* Arama Barı ve Filtreler */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search user, action, entity..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm input-bordered w-full pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedActionFilter}
              onChange={(e) => {
                setSelectedActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="select select-sm select-bordered bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg w-full sm:w-40"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE Only</option>
              <option value="UPDATE">UPDATE Only</option>
              <option value="DELETE">DELETE Only</option>
            </select>
          </div>
        </div>

        {/* Tablo İçeriği */}
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Fetching audit trail..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <div className="text-3xl">📋</div>
            <p className="text-sm font-semibold">No audit logs found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 w-44">Timestamp</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">
                        {log.userName || log.userEmail?.split("@")[0] || "System"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {log.userEmail || "System Auto"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{log.entityName}</span>
                        {log.entityId && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-xs text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800/60 rounded-md gap-1 font-semibold"
                      >
                        <EyeIcon />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* High-Contrast Dark Mode Pagination */}
        {!loading && filteredLogs.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div>
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </span>{" "}
              of <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="btn btn-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 font-semibold"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="btn btn-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detay Gösterim Modalı */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Audit Event Detail
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400">User:</span>{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedLog.userEmail || "System"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Action:</span>{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400">Entity:</span>{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.entityName}</span>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Details</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {selectedLog.details}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedLog.oldValues && (
                <div>
                  <label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Previous Values
                  </label>
                  <pre className="p-3 bg-slate-950 text-rose-300 rounded-xl text-[11px] font-mono overflow-x-auto mt-1 max-h-48 border border-slate-800">
                    {selectedLog.oldValues}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    New Values
                  </label>
                  <pre className="p-3 bg-slate-950 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto mt-1 max-h-48 border border-slate-800">
                    {selectedLog.newValues}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn btn-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-none text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}