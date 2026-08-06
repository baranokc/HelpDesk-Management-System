import { api } from "../lib/api";
import type {
  TicketAttachmentCreateDto,
  TicketAttachmentDto,
  TicketAttachmentUpdateDto,
} from "@/src/types/ticket-attachment";

async function getAttachmentBlob(
  ticketId: string,
  attachmentId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/tickets/${ticketId}/attachments/${attachmentId}/download`,
    {
      responseType: "blob",
      signal,
    },
  );

  return response.data;
}

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
    const blob = await getAttachmentBlob(ticketId, attachment.id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = attachment.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },

  getPreviewBlob: async (
    ticketId: string,
    attachmentId: string,
    signal?: AbortSignal,
  ): Promise<Blob> => getAttachmentBlob(ticketId, attachmentId, signal),

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
