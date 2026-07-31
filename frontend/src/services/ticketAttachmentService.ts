import { api } from "../lib/api";
import type {
  TicketAttachmentCreateDto,
  TicketAttachmentDto,
  TicketAttachmentUpdateDto,
} from "@/src/types/ticket-attachment";

export const ticketAttachmentService = {
  getByTicketId: async (
    ticketId: string,
    commentId?: string | null,
  ): Promise<TicketAttachmentDto[]> => {
    const response = await api.get<TicketAttachmentDto[]>(
      `/tickets/${ticketId}/attachments`,
      {
        params: commentId ? { commentId } : undefined,
      },
    );

    return response.data;
  },

  uploadAttachments: async (
    ticketId: string,
    dto: TicketAttachmentCreateDto,
  ): Promise<TicketAttachmentDto[]> => {
    const formData = new FormData();

    dto.files.forEach((file) => {
      formData.append("Files", file);
    });

    if (dto.commentId) {
      formData.append("CommentId", dto.commentId);
    }

    if (dto.description) {
      formData.append("Description", dto.description);
    }

    const response = await api.post<TicketAttachmentDto[]>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  downloadAttachment: async (
    ticketId: string,
    attachment: TicketAttachmentDto,
  ): Promise<void> => {
    const response = await api.get<Blob>(
      `/tickets/${ticketId}/attachments/${attachment.id}/download`,
      {
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");

    link.href = url;
    link.download = attachment.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },

  updateAttachment: async (
    ticketId: string,
    attachmentId: string,
    dto: TicketAttachmentUpdateDto,
  ): Promise<void> => {
    await api.patch(
      `/tickets/${ticketId}/attachments/${attachmentId}`,
      dto,
    );
  },

  deleteAttachment: async (
    ticketId: string,
    attachmentId: string,
  ): Promise<void> => {
    await api.delete(
      `/tickets/${ticketId}/attachments/${attachmentId}`,
    );
  },
};
