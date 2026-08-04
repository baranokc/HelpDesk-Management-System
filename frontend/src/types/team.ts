export interface TeamAgentDto {
    id: string;
    fullName: string;
    email: string;
  }
  
  export interface EligibleAgentDto {
    id: string;
    fullName: string;
    email: string;
  }
  
  export interface TeamDto {
    id: string;
    name: string;
    description?: string | null;
    leadId?: string | null;
    leadName?: string | null;
    memberCount: number;
    createdAt: string;
    agents?: TeamAgentDto[];
  }
  
  export interface CreateTeamDto {
    name: string;
    description?: string;
    leadId?: string;
  }
  
  export interface UpdateTeamDto {
    name: string;
    description?: string;
    leadId?: string;
  }
  
  export interface AddMemberDto {
    userId: string;
  }