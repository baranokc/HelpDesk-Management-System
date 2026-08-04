import { api } from "@/src/lib/api";
import type {
  TeamManagementOverviewDto,
  TeamMemberDetailDto,
} from "@/src/types/team-management";

export const teamManagementService = {
  getOverview: async (
    teamId?: string,
  ): Promise<TeamManagementOverviewDto> => {
    const response = await api.get<TeamManagementOverviewDto>(
      "/team-management",
      {
        params: teamId ? { teamId } : undefined,
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
};