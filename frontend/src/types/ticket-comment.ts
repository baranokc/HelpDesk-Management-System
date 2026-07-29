import { TicketAttachmentDto } from "./ticket-attachment";
export interface TicketCommentDto{
    id : string;
    comment : string;
    createdById : string;
    createdBName : string;
    createdAt: string;
    editedAt : string | null;
    isEternal : string;
    attachments : TicketAttachmentDto;
}
export interface TicketCommentUpdateDto {
    comment : string;
    isInternal : string;
}
export interface TicketCommentCreateDto {
    comment : string;
    attachments : File[];
    isInternal : string;
}