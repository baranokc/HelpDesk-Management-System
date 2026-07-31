export interface PagedResultDto<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface LookupItemDto <TId=string> {
    itemId: TId;
    name: string;
}

export interface TeamMemberLookupDto {
    teamMemberId: string;
    userId: string;
    fullName: string;
    roleInTeam: string;
}