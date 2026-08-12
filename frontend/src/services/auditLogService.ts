import { api } from "@/src/lib/api";

export interface AuditLogDto {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | string;
  entityName: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  details?: string | null;
  createdAt: string;
}

export interface AuditLogResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: AuditLogDto[];
}

export interface AuditLogDateRange {
  from?: string;
  to?: string;
}

export const auditLogService = {
  getAuditLogs: async (
    page = 1,
    pageSize = 50,
    dateRange: AuditLogDateRange = {}
  ): Promise<AuditLogResponse> => {
    const response = await api.get<AuditLogResponse>("/auditlogs", {
      params: {
        page,
        pageSize,
        ...dateRange,
      },
    });

    return response.data;
  },

  exportAuditLogs: async (
    dateRange: AuditLogDateRange = {}
  ): Promise<Blob> => {
    const response = await api.get<Blob>("/auditlogs/export", {
      params: dateRange,
      responseType: "blob",
    });

    return response.data;
  },
};
