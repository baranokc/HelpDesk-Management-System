import { api } from '../lib/api';
import {
  TicketAttachmentDto,
  TicketAttachmentCreateDto,
  TicketAttachmentUpdateDto,
  TicketAttachmentDownloadDto,
} from '@/src/types/ticket-attachment';

export const ticketAttachmentService = {
  getByTicketId: async (ticketId: string): 
    Promise<TicketAttachmentDto[]> => {const response = await api.get<TicketAttachmentDto[]>(`/tickets/${ticketId}/attachments`);
    return response.data;
  },
  uploadAttachments: async (ticketId: string,dto: TicketAttachmentCreateDto): 
    Promise<TicketAttachmentDto[]> => {const formData = new FormData(); dto.files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post<TicketAttachmentDto[]>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  downloadAttachment: async (
    attachmentId: string,
    dto: TicketAttachmentDownloadDto
  ): Promise<void> => {
    const response = await api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: dto.contentType })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', dto.fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  updateAttachment: async (
    attachmentId: string,
    dto: TicketAttachmentUpdateDto
  ): Promise<void> => {
    await api.put(`/attachments/${attachmentId}`, dto);
  },
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await api.delete(`/attachments/${attachmentId}`);
  },
};