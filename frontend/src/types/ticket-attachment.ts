export interface TicketAttachmentDto {
    id : string;
    fileName : string;
    contentType : string;
    fileSize : number;
    downloadUrl : string;
    description? : string | null;
    commentId? : string | null;
    uploadedById : string;
    uploadedByName : string;
    uploadedAt : string;
}
export interface TicketAttachmentCreateDto {
    files : File[];
    commentId? : string | null;
    description? : string |  null,
}
export interface TicketAttachmentDownloadDto {
    physicalPath : string;
    contentType? : string;
    fileName : string;
}
export interface TicketAttachmentUpdateDto {
    description? : string | null;
}