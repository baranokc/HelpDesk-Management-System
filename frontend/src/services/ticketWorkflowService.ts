import { api } from "@/src/lib/api";
import type {
  TicketHistoryDto,
  TicketResolveDto,
  TicketStatusUpdateDto,
} from "@/src/types/ticket-status";

export const ticketWorkflowService = {
  updateStatus: async (dto: TicketStatusUpdateDto): Promise<void> => {
    await api.post("/TicketStatus/update", dto);
  },

  resolveTicket: async (
    ticketId: string,
    dto: TicketResolveDto,
  ): Promise<void> => {
    await api.post(`/tickets/${ticketId}/resolve`, dto);
  },

  closeTicket: async (ticketId: string): Promise<void> => {
    await api.post(`/tickets/${ticketId}/close`);
  },

  getHistory: async (ticketId: string): Promise<TicketHistoryDto[]> => {
    const response = await api.get<TicketHistoryDto[]>(
      `/tickets/${ticketId}/history`,
    );

    return response.data;
  },
};
