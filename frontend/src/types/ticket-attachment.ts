export interface TicketAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
  description?: string | null;
  commentId?: string | null;
  uploadedById: string;
  uploadedByName?: string | null;
  uploadedAt: string;
}

export interface TicketAttachmentCreateDto {
  files: File[];
  commentId?: string | null;
  description?: string | null;
}

export interface TicketAttachmentUpdateDto {
  description?: string | null;
}
