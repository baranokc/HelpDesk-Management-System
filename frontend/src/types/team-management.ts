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

export interface CsatStatsDto {
  averageRating: number;
  averageCommunicationRating: number;
  averageSolutionRating: number;
  averageSpeedRating: number;
  totalSurveysCount: number;
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
  csat: CsatStatsDto;
  recentTickets: TeamMemberTicketDto[];
}

export interface UnassignedTeamTicketDto {
  id: string;
  ticketNumber: string;
  ticketTitle: string;
  categoryName: string;
  statusName: string;
  priorityName: string;
  createdByName: string;
  createdByAvatarUrl?: string | null;
  createdAt: string;
}

export interface TeamManagementOverviewDto {
  teamId: string;
  teamName: string;
  teamDescription: string;
  managedTeams: ManagedTeamDto[];
  stats: TeamTicketStatsDto;
  csat: CsatStatsDto;
  unassignedTickets: PagedResultDto<UnassignedTeamTicketDto>;
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
  schedule: TeamMemberScheduleDto;
  stats: TeamTicketStatsDto;
  activeTickets: PagedResultDto<TeamMemberTicketDto>;
  inactiveTickets: PagedResultDto<TeamMemberTicketDto>;
}

export interface TeamMemberScheduleDto {
  timeZoneId: string;
  shifts: TeamMemberShiftDto[];
  leaves: TeamMemberLeaveDto[];
}

export interface TeamMemberShiftDto {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface TeamMemberLeaveDto {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface UpdateTeamMemberScheduleDto {
  shifts: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

export interface CreateTeamMemberLeaveDto {
  startDate: string;
  endDate: string;
  reason: string;
}
