export interface TicketAssignmentDto {
    teamId : string;
    teamMemberId? : string | null;
    reason? : string | null;
}
export interface TicketAssignmentResponseDto {
    id : string;
    ticketId : string;
    teamId : string;
    teamName : string;
    teamMemberId? : string | null;
    teamMemberName? : string | null;
    assignedById : string;
    assignedByName : string;
    assignedAt : string;
    Note? : string | null;
}
export interface TicketAssignmentCreateDto {
    ticketId : string;
    assignedById : string;
    note? : string | null;
}
export interface TicketAssignRequestDto{
    id : string;
    teamId : string;
    ticketId : string;
    teamMemberId? : string | null;
    note? : string | null;
}
export interface TicketUnassignmentDto {
    reason? : string | null;
    keepTeamAssignment : boolean;
}