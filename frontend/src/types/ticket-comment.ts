import { TicketAttachmentDto } from "./ticket-attachment";
export interface TicketCommentDto{
    id : string;
    comment : string;
    createdById : string;
    createdByName : string;
    createdAt: string;
    editedAt : string | null;
    isInternal : string;
    attachments : TicketAttachmentDto[];
}
export interface TicketCommentUpdateDto {
    comment : string;
    isInternal : string;
}
export interface TicketCommentCreateDto {
    comment : string;
    attachments : File[];
    isInternal : boolean;
}