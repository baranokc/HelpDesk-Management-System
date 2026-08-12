"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Search, RotateCw, Download, Eye, X, 
  Activity, PlusCircle, Pencil, Trash2, Layers 
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
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

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
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
      setError("Failed to load audit logs. Please try again.");
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
    setError(null);
    try {
      // Backend'den veri çekiliyor
      const response = await api.get("/auditlogs/export", {
        responseType: "blob", 
      });
      
      // 🌟 DÜZELTME: Backend CSV gönderdiği için MIME türü ve uzantı .csv yapıldı.
      // Bu sayede Excel "Uzantı veya format geçersiz" uyarısı vermeden doğrudan açar.
      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `AuditLogs_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Bellek temizliği
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export failed", err);
      setError("Excel export failed. Please check your connection or try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("ADD")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 px-3 py-1 text-xs font-bold font-mono">
          {action}
        </span>
      );
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("REORDER")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 px-3 py-1 text-xs font-bold font-mono">
          {action}
        </span>
      );
    }
    if (act.includes("DELETE") || act.includes("REMOVE")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40 px-3 py-1 text-xs font-bold font-mono">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200/70 text-stone-700 border border-stone-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-bold font-mono">
        {action}
      </span>
    );
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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Sayfa Başlığı ve Sağ Butonlar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Track user activities, security events, and system changes in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchAuditLogs()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-100 dark:bg-slate-800 px-3.5 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-sm transition-all hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600 dark:text-pink-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => void handleExportExcel()}
            disabled={isExporting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Audit Stat Kartları */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Total Events
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
              {Array.isArray(logs) ? logs.length : 0}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900/10 dark:bg-slate-100/15 text-stone-900 dark:text-slate-100 border border-stone-900/20 dark:border-slate-100/30">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Creations */}
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Creations
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
              {Array.isArray(logs) ? logs.filter((l) => l.action.toUpperCase().includes("CREATE")).length : 0}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
            <PlusCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Updates */}
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Updates
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
              {Array.isArray(logs) ? logs.filter((l) => l.action.toUpperCase().includes("UPDATE")).length : 0}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-800 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
            <Pencil className="h-5 w-5" />
          </div>
        </div>

        {/* Deletions */}
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Deletions
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
              {Array.isArray(logs) ? logs.filter((l) => l.action.toUpperCase().includes("DELETE")).length : 0}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
            <Trash2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ARAMA VE FİLTRE BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-stone-200/80 dark:border-purple-900/40 shadow-xl backdrop-blur-2xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search user, action, entity..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 text-xs pl-9 pr-3 py-2 font-medium focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-slate-500" />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <select
            value={selectedActionFilter}
            onChange={(e) => {
              setSelectedActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 text-stone-800 dark:text-slate-200 text-xs px-3 py-2 font-bold focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE Only</option>
            <option value="UPDATE">UPDATE Only</option>
            <option value="DELETE">DELETE Only</option>
          </select>
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
            Showing: <b className="text-stone-800 dark:text-slate-200">{filteredLogs.length}</b> / {logs.length}
          </span>
        </div>
      </div>

      {/* TABLO KARTI */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Fetching audit trail..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="h-10 w-10 mx-auto text-stone-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-stone-800 dark:text-slate-200">No audit logs found</p>
            <p className="text-xs font-medium text-stone-400 dark:text-slate-500">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[950px]">
              <thead className="bg-stone-50/80 dark:bg-slate-800/50 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 w-[18%]">Timestamp</th>
                  <th className="px-5 py-3.5 w-[20%]">User</th>
                  <th className="px-5 py-3.5 w-[16%]">Action</th>
                  <th className="px-5 py-3.5 w-[20%]">Target Entity</th>
                  <th className="px-5 py-3.5 w-[14%]">IP Address</th>
                  <th className="pr-6 pl-2 py-3.5 w-[12%] text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-medium">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-stone-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-stone-900 dark:text-white text-xs truncate">
                        {log.userName || log.userEmail?.split("@")[0] || "System"}
                      </div>
                      <div className="text-[11px] font-medium text-stone-400 dark:text-slate-400 truncate">
                        {log.userEmail || "System Auto"}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-stone-800 dark:text-slate-200 text-xs truncate">{log.entityName}</span>
                        {log.entityId && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700 shrink-0">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs font-bold text-stone-400 dark:text-slate-500 whitespace-nowrap">
                      {log.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="pr-6 pl-2 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-purple-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-stone-200 dark:border-slate-700/80"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-100 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-stone-500 dark:text-slate-400">
            <div>
              Showing <b className="text-stone-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</b> to{" "}
              <b className="text-stone-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </b>{" "}
              of <b className="text-stone-900 dark:text-white">{filteredLogs.length}</b> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="rounded-xl border border-stone-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-stone-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="rounded-xl border border-stone-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAY GÖSTERİM MODALI */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-purple-900/40 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl transition-all max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  Audit Event Detail
                </h3>
                <p className="text-xs font-mono font-bold text-stone-400 dark:text-slate-500 mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-stone-100 dark:border-slate-800 font-medium">
              <div>
                <span className="text-stone-400 dark:text-slate-500 block text-[10px] font-mono font-bold uppercase tracking-wider">User</span>
                <span className="font-bold text-stone-900 dark:text-slate-100">
                  {selectedLog.userEmail || "System"}
                </span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-slate-500 block text-[10px] font-mono font-bold uppercase tracking-wider">Action</span>
                <span className="font-bold text-stone-900 dark:text-slate-100">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-slate-500 block text-[10px] font-mono font-bold uppercase tracking-wider">Entity</span>
                <span className="font-bold text-stone-900 dark:text-slate-100">{selectedLog.entityName}</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-slate-500 block text-[10px] font-mono font-bold uppercase tracking-wider">Date</span>
                <span className="font-bold text-stone-900 dark:text-slate-100">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                  Details
                </label>
                <div className="p-3.5 bg-stone-50 dark:bg-slate-800/80 rounded-2xl text-xs font-medium text-stone-800 dark:text-slate-200 border border-stone-200/80 dark:border-slate-700">
                  {selectedLog.details}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedLog.oldValues && (
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                    Previous Values
                  </label>
                  <pre className="p-3.5 bg-stone-950 text-rose-300 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 border border-stone-800 whitespace-pre-wrap break-words">
                    {selectedLog.oldValues}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                    New Values
                  </label>
                  <pre className="p-3.5 bg-stone-950 text-amber-300 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 border border-stone-800 whitespace-pre-wrap break-words">
                    {selectedLog.newValues}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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