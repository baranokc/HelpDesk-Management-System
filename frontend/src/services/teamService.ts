import { api } from "@/src/lib/api";
import type {
  TeamDto,
  CreateTeamDto,
  UpdateTeamDto,
  EligibleAgentDto,
} from "@/src/types/team";

function extractData<T>(response: unknown): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data: unknown }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

function normalizeTeam(team: any): TeamDto {
  if (!team) return team;
  return {
    ...team,
    id: team.id || team.Id,
    name: team.name || team.Name,
    description: team.description ?? team.Description,
    leadId: team.leadId ?? team.LeadId,
    leadName: team.leadName ?? team.LeadName,
    memberCount: team.memberCount ?? team.MemberCount ?? 0,
    createdAt: team.createdAt || team.CreatedAt,
    agents: (team.agents || team.Agents || []).map((a: any) => ({
      ...a,
      id: a.id || a.Id,
      fullName: a.fullName || a.FullName,
      email: a.email || a.Email,
    })),
  };
}

export const teamService = {
  getAllTeams: async (): Promise<TeamDto[]> => {
    const res = await api.get("/teams");
    const data = extractData<any[]>(res);
    return Array.isArray(data) ? data.map(normalizeTeam) : [];
  },

  getTeamById: async (id: string): Promise<TeamDto> => {
    if (!id || id === "undefined" || id.trim() === "") {
      throw new Error("Invalid Team ID provided.");
    }
    const res = await api.get(`/teams/${id}`);
    const data = extractData<any>(res);
    return normalizeTeam(data);
  },

  getEligibleAgents: async (): Promise<EligibleAgentDto[]> => {
    const res = await api.get("/teams/eligible-agents");
    const data = extractData<any[]>(res);
    return Array.isArray(data)
      ? data.map((a: any) => ({
          id: a.id || a.Id,
          fullName: a.fullName || a.FullName,
          email: a.email || a.Email,
        }))
      : [];
  },

  createTeam: async (dto: CreateTeamDto): Promise<TeamDto> => {
    const res = await api.post("/teams", dto);
    const data = extractData<any>(res);
    return normalizeTeam(data);
  },

  updateTeam: async (id: string, dto: UpdateTeamDto): Promise<void> => {
    if (!id || id === "undefined" || id.trim() === "") {
      throw new Error("Invalid Team ID provided.");
    }
    await api.put(`/teams/${id}`, dto);
  },

  setTeamLead: async (id: string, leadId: string | null): Promise<void> => {
    if (!id || id === "undefined" || id.trim() === "") {
      throw new Error("Invalid Team ID provided.");
    }
    await api.put(`/teams/${id}/lead`, { leadId });
  },

  deleteTeam: async (id: string): Promise<void> => {
    if (!id || id === "undefined" || id.trim() === "") {
      throw new Error("Invalid Team ID provided.");
    }
    await api.delete(`/teams/${id}`);
  },

  addMember: async (teamId: string, userId: string): Promise<void> => {
    if (!teamId || teamId === "undefined" || teamId.trim() === "") {
      throw new Error("Invalid Team ID provided.");
    }
    await api.post(`/teams/${teamId}/members`, { userId });
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    if (!teamId || teamId === "undefined" || teamId.trim() === "") {
      throw new Error("Invalid Team ID provided.");
    }
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },
};

export default teamService;