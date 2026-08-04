import type { PagedResultDto } from "./common";

export interface ManagedTeamDto {
  id: string;
  name: string;
}

export interface TeamTicketStatsDto {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
}

export interface TeamMemberTicketDto {
  id: string;
  ticketNumber: string;
  ticketTitle: string;
  priorityName: string;
  urgencyLevelName: string;
  statusName: string;
  createdByName: string;
  assignedToName?: string | null;
  createdAt: string;
  assignedAt?: string | null;
  isCreatedByMember: boolean;
  isAssignedToMember: boolean;
}

export interface TeamMemberSummaryDto {
  teamMemberId: string;
  userId: string;
  fullName: string;
  title: string;
  roleInTeam: string;
  joinedAt: string;
  recentTickets: TeamMemberTicketDto[];
}

export interface TeamManagementOverviewDto {
  teamId: string;
  teamName: string;
  teamDescription: string;
  managedTeams: ManagedTeamDto[];
  stats: TeamTicketStatsDto;
  members: TeamMemberSummaryDto[];
}

export interface TeamMemberDetailDto {
  teamId: string;
  teamName: string;
  teamMemberId: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  roleInTeam: string;
  systemRole: string;
  registeredAt: string;
  joinedAt: string;
  stats: TeamTicketStatsDto;
  activeTickets: PagedResultDto<TeamMemberTicketDto>;
  inactiveTickets: PagedResultDto<TeamMemberTicketDto>;
}
