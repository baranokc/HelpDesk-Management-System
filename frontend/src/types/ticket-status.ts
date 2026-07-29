export interface TicketHistoryDto {
    id : string;
    ticketId : string;
    actionType : string;
    fieldName? : string | null;
    oldValue? : string | null;
    newValue? : string | null;
    description? : string | null;
    changedById : string;
    changedByName : string | null;
    changedAt : string;
}
export interface TicketStatusUpdateDto {
    ticketId : string;
    statusId : string;
    reason? : string | null;
}
export interface TicketResolveDto {
    resolution : string;
    resolutionCategoryId? : string | null;
    internalNote? : string | null;
}
export interface TicketStatusResponseDto{
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