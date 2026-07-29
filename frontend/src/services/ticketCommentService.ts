import { api } from '../lib/api';
import {
  TicketCommentDto,
  TicketCommentCreateDto,
  TicketCommentUpdateDto,
} from '@/src/types/ticket-comment';

export const ticketCommentService = {
  getByTicketId: async (ticketId: string): 
    Promise<TicketCommentDto[]> => {const response = await api.get<TicketCommentDto[]>(`/tickets/${ticketId}/comments`);
    return response.data;
  },
  createComment: async (ticketId: string, dto: TicketCommentCreateDto): 
    Promise<TicketCommentDto> => {const response = await api.post<TicketCommentDto>(`/tickets/${ticketId}/comments`,dto);
    return response.data;
  },
  updateComment: async (commentId: string,dto: TicketCommentUpdateDto):
    Promise<void> => {await api.put(`/comments/${commentId}`, dto);
  },
  deleteComment: async (commentId: string): 
  Promise<void> => {await api.delete(`/comments/${commentId}`);
  },
};