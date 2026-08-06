import { api } from "@/src/lib/api";

export interface SatisfactionSurveyDto {
  id: string;
  ticketId: string;
  userId: string;
  rating: number;
  communicationRating: number;
  solutionRating: number;
  speedRating: number;
  comment: string;
  createdAt: string;
}

export interface CreateSatisfactionSurveyInput {
  communicationRating: number;
  solutionRating: number;
  speedRating: number;
  comment?: string;
}

export interface TeamSatisfactionStatsDto {
  teamId: string;
  teamName: string;
  averageRating: number;
  averageCommunicationRating: number;
  averageSolutionRating: number;
  averageSpeedRating: number;
  totalSurveysCount: number;
}

export const surveyService = {
  submitSurvey: async (
    ticketId: string,
    data: CreateSatisfactionSurveyInput,
  ): Promise<SatisfactionSurveyDto> => {
    const response = await api.post<SatisfactionSurveyDto>(
      `/tickets/${ticketId}/survey`,
      data,
    );
    return response.data;
  },

  getSurvey: async (
    ticketId: string,
  ): Promise<SatisfactionSurveyDto | null> => {
    try {
      const response = await api.get<SatisfactionSurveyDto>(
        `/tickets/${ticketId}/survey`,
      );
      return response.data;
    } catch {
      return null;
    }
  },

  getTeamStats: async (): Promise<TeamSatisfactionStatsDto[]> => {
    const response = await api.get<TeamSatisfactionStatsDto[]>(
      "/tickets/surveys/team-stats",
    );
    return response.data;
  },
};
