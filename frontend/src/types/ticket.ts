export interface TicketListDto {
    id : string;
    ticketNumber : string;
    ticketTitle : string;
    statusName : string;
    priortyName : string;
    categoryName : string;
    subcategoryName? : string | null;
    createdByName : string;
    assignedToName? : string | null;
    createdAt : string;
}
import { TicketCommentDto } from "./ticket-comment";
import { TicketAttachmentDto } from './ticket-attachment';
export interface TicketDetailDto {
    id : string;
    ticketNumber : string;
    ticketTitle : string;
    ticketDescription : string;
    subject : string;
    teamId? : string | null;
    teamName? : string | null;
    statusId : string;
    statusName : string;
    priorityId : string;
    priorityName : string;
    categoryId : string;
    categoryName : string;
    subcategoryId? : string | null;
    subcategoryName? : string;
    impactLevelId : string;
    impactLevelName : string;
    urgencyLevelId : string;
    urgencyLevelName : string;
    createdById : string;
    createdByName : string;
    assignedToId? : string | null;
    assignedtoName? : string | null;
    createdAt : string;
    firstResponseAt? : string | null;
    resolvedAt? : string | null;
    closedAt? : string | null;
    comments : TicketCommentDto[];
    attachments : TicketAttachmentDto[];
}
export interface TicketCreateDto {
    ticketTitle : string;
    ticketDescription : string,
    subject : string;
    categoryId : string;
    subcategoryId? : string | null;
    priorityId : string;
    impactLevelId : string;
    urgencyLevelId : string;
}
export interface TicketFilterDto {
    search? : string | null;
    statusId? : string | null;
    categoryId? : string | null;
    assignedToId? : string | null;
    createdById? : string | null;
    urgencyLevelId? : string | null;
    impactLevelId? : string | null;
    createdFrom : string | null;
    createdTo : string | null;
    pageNumber? : number;
    pageSize? : number;
}
export interface TicketResponseDto {
    id : string;
    ticketTitle : string;
    ticketDescription : string;
    subject : string;
    statusName : string;
    impactLevelName : string;
    urgencyLevelName : string;
    priorityName : string;
    categoryName : string;
    createdByName : string;
    assignedToName? : string | null;
    createdAt : string;
}
export interface TicketUpdateDto{
    ticketTitle : string;
    ticketDescription : string;
    subject : string;
    categoryId : string;
    subcategoryId? : string | null;
    priorityId : string;
    impactLevelId : string;
    urgencyLevelId : string;
}
