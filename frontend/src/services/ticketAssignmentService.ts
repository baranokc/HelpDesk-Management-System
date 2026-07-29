import { api } from '../lib/api';
import {
  TicketAssignmentDto,
  TicketAssignmentResponseDto,
  TicketUnassignmentDto,
} from '@/src/types/ticket-assignment';

export const ticketAssignmentService = {
  assignTicket: async (ticketId: string,dto: TicketAssignmentDto): 
    Promise<TicketAssignmentResponseDto> => {
    const response = await api.post<TicketAssignmentResponseDto>(`/tickets/${ticketId}/assign`,dto);
    return response.data;
  },
  unassignTicket: async (ticketId: string,dto?: TicketUnassignmentDto):
    Promise<void> => {await api.post(`/tickets/${ticketId}/unassign`, dto);
  },
  getAssignmentHistory: async (ticketId: string): 
    Promise<TicketAssignmentResponseDto[]> => {const response = await api.get<TicketAssignmentResponseDto[]>(`/tickets/${ticketId}/assignments`);
    return response.data;
  },
};