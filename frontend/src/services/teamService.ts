import { api } from "@/src/lib/api";
import type { TeamDto, CreateTeamDto, UpdateTeamDto } from "@/src/types/team";

export const teamService = {
  getAllTeams: async (): Promise<TeamDto[]> => {
    const response = await api.get<TeamDto[]>("/teams");
    return response.data;
  },

  createTeam: async (dto: CreateTeamDto): Promise<TeamDto> => {
    const response = await api.post<TeamDto>("/teams", dto);
    return response.data;
  },

  updateTeam: async (id: string, dto: UpdateTeamDto): Promise<void> => {
    await api.put(`/teams/${id}`, dto);
  },

  deleteTeam: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },
};