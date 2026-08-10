import { api } from "@/src/lib/api";
import type {
  TeamManagementOverviewDto,
  TeamMemberDetailDto,
  TeamMemberLeaveDto,
  TeamMemberScheduleDto,
  UpdateTeamMemberScheduleDto,
  CreateTeamMemberLeaveDto,
} from "@/src/types/team-management";

export const teamManagementService = {
  getOverview: async (
    teamId?: string,
    unassignedPageNumber = 1,
    unassignedPageSize = 10,
  ): Promise<TeamManagementOverviewDto> => {
    const response = await api.get<TeamManagementOverviewDto>(
      "/team-management",
      {
        params: {
          teamId: teamId || undefined,
          unassignedPageNumber,
          unassignedPageSize,
        },
      },
    );

    return response.data;
  },

  getMemberDetail: async (
    teamMemberId: string,
    activePageNumber = 1,
    inactivePageNumber = 1,
    pageSize = 25,
  ): Promise<TeamMemberDetailDto> => {
    const response = await api.get<TeamMemberDetailDto>(
      `/team-management/members/${teamMemberId}`,
      {
        params: {
          activePageNumber,
          inactivePageNumber,
          pageSize,
        },
      },
    );

    return response.data;
  },

  getOwnMemberDetail: async (
    activePageNumber = 1,
    inactivePageNumber = 1,
    pageSize = 25,
  ): Promise<TeamMemberDetailDto> => {
    const response = await api.get<TeamMemberDetailDto>("/team-management/me", {
      params: {
        activePageNumber,
        inactivePageNumber,
        pageSize,
      },
    });

    return response.data;
  },

  updateMemberSchedule: async (
    teamMemberId: string,
    dto: UpdateTeamMemberScheduleDto,
  ): Promise<TeamMemberScheduleDto> => {
    const response = await api.put<TeamMemberScheduleDto>(
      `/team-management/members/${teamMemberId}/schedule`,
      dto,
    );

    return response.data;
  },

  addMemberLeave: async (
    teamMemberId: string,
    dto: CreateTeamMemberLeaveDto,
  ): Promise<TeamMemberLeaveDto> => {
    const response = await api.post<TeamMemberLeaveDto>(
      `/team-management/members/${teamMemberId}/leaves`,
      dto,
    );

    return response.data;
  },

  updateMemberLeave: async (
    teamMemberId: string,
    leaveId: string,
    dto: CreateTeamMemberLeaveDto,
  ): Promise<TeamMemberLeaveDto> => {
    const response = await api.put<TeamMemberLeaveDto>(
      `/team-management/members/${teamMemberId}/leaves/${leaveId}`,
      dto,
    );

    return response.data;
  },

  deleteMemberLeave: async (
    teamMemberId: string,
    leaveId: string,
  ): Promise<void> => {
    await api.delete(
      `/team-management/members/${teamMemberId}/leaves/${leaveId}`,
    );
  },
};
