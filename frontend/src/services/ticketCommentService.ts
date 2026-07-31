import { api } from "../lib/api";
import type {
  TicketCommentCreateDto,
  TicketCommentDto,
  TicketCommentUpdateDto,
} from "@/src/types/ticket-comment";

export const ticketCommentService = {
  getByTicketId: async (ticketId: string): Promise<TicketCommentDto[]> => {
    const response = await api.get<TicketCommentDto[]>(
      `/tickets/${ticketId}/comments`,
    );

    return response.data;
  },

  createComment: async (
    ticketId: string,
    dto: TicketCommentCreateDto,
  ): Promise<TicketCommentDto> => {
    const formData = new FormData();
    formData.append("comment", dto.comment);
    formData.append("isInternal", String(dto.isInternal));
    dto.attachments.forEach((file) => formData.append("attachments", file));

    const response = await api.post<TicketCommentDto>(
      `/tickets/${ticketId}/comments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  updateComment: async (
    ticketId: string,
    commentId: string,
    dto: TicketCommentUpdateDto,
  ): Promise<void> => {
    await api.put(`/tickets/${ticketId}/comments/${commentId}`, dto);
  },

  deleteComment: async (ticketId: string, commentId: string): Promise<void> => {
    await api.delete(`/tickets/${ticketId}/comments/${commentId}`);
  },
};
