import { TicketAttachmentDto } from "./ticket-attachment";
export interface TicketCommentDto{
    id : string;
    comment : string;
    createdById : string;
    createdByName : string;
    createdByRole? : string;
    createdAt: string;
    editedAt : string | null;
    isInternal : boolean;
    attachments : TicketAttachmentDto[];
}
export interface TicketCommentUpdateDto {
    comment : string;
    isInternal : boolean;
}
export interface TicketCommentCreateDto {
    comment : string;
    attachments : File[];
    isInternal : boolean;
}