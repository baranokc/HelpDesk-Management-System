"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { auditLogService, type AuditLogDto } from "@/src/services/auditLogService";

// Export / Download Icon
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const loadLogs = async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditLogService.getAuditLogs(currentPage, 30);
      setLogs(data.items);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load audit logs from database."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs(page);
  }, [page]);

  // Excel / CSV İndirme Fonksiyonu
  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      // Tüm log verilerini Excel export için çekiyoruz
      const allData = await auditLogService.getAuditLogs(1, 10000);
      const dataToExport = allData.items.length > 0 ? allData.items : logs;

      if (dataToExport.length === 0) {
        alert("No logs available to export.");
        return;
      }

      // CSV Başlıkları
      const headers = [
        "ID",
        "Date",
        "User Name",
        "User Email",
        "Action",
        "Entity / Table",
        "Entity ID",
        "IP Address",
        "Old Values",
        "New Values"
      ];

      // Satırları CSV formatına çevirme
      const csvRows = [
        headers.join(","),
        ...dataToExport.map((log) =>
          [
            `"${log.id}"`,
            `"${new Date(log.createdAt).toLocaleString("en-US")}"`,
            `"${(log.userName || "").replace(/"/g, '""')}"`,
            `"${(log.userEmail || "").replace(/"/g, '""')}"`,
            `"${log.action}"`,
            `"${log.entityName}"`,
            `"${log.entityId || ""}"`,
            `"${log.ipAddress || ""}"`,
            `"${(log.oldValues || "").replace(/"/g, '""')}"`,
            `"${(log.newValues || "").replace(/"/g, '""')}"`
          ].join(",")
        )
      ];

      // UTF-8 BOM ekleyerek Excel'in karakterleri doğru algılamasını sağlıyoruz
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      console.error("Export error:", err);
      alert("An error occurred while exporting logs.");
    } finally {
      setExporting(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
      case "UPDATE":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border-amber-300 dark:border-amber-800";
      case "DELETE":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border-rose-300 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    }
  };

  const formatJson = (jsonString: string | null) => {
    if (!jsonString) return "None";
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Detailed record of all system creation, update, and deletion operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportToExcel}
            disabled={exporting || loading}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-2 disabled:opacity-50"
          >
            <DownloadIcon />
            <span>{exporting ? "Exporting..." : "Export to Excel"}</span>
          </button>

          <button
            onClick={() => void loadLogs(page)}
            className="btn btn-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner label="Fetching audit logs..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No audit log entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Table / Entity</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US")}
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      <div>{log.userName}</div>
                      {log.userEmail && (
                        <div className="text-xs text-slate-400">{log.userEmail}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-mono text-xs">
                      {log.entityName}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {log.ipAddress || "-"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        View Changes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 border-slate-300 dark:border-slate-700"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 border-slate-300 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Log Details - {selectedLog.entityName} ({selectedLog.action})
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="font-semibold text-rose-500 block">Old Values</span>
                <pre className="p-3 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-60">
                  {formatJson(selectedLog.oldValues)}
                </pre>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-emerald-500 block">New Values</span>
                <pre className="p-3 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-60">
                  {formatJson(selectedLog.newValues)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded text-xs hover:bg-slate-700"
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