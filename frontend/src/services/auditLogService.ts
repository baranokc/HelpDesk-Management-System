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
  createdAt: string;
}

export interface AuditLogResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: AuditLogDto[];
}

export const auditLogService = {
  getAuditLogs: async (page = 1, pageSize = 50): Promise<AuditLogResponse> => {
    const response = await api.get<AuditLogResponse>(
      `/auditlogs?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },
};