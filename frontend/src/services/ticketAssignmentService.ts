import { api } from "../lib/api";
import type {
  TicketAssignmentDto,
  TicketAssignmentResponseDto,
  TicketUnassignmentDto,
} from "@/src/types/ticket-assignment";

export const ticketAssignmentService = {
  assignTicket: async (
    ticketId: string,
    dto: TicketAssignmentDto,
  ): Promise<TicketAssignmentResponseDto> => {
    const response = await api.post<TicketAssignmentResponseDto>(
      `/tickets/${ticketId}/assign`,
      dto,
    );

    return response.data;
  },

  unassignTicket: async (
    ticketId: string,
    dto: TicketUnassignmentDto,
  ): Promise<void> => {
    await api.delete(`/tickets/${ticketId}/assign`, {
      data: dto,
    });
  },
};
