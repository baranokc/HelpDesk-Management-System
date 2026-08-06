import { api } from "@/src/lib/api";

export interface SatisfactionSurveyDto {
  id: string;
  ticketId: string;
  userId: string;
  rating: number;
  communicationRating: number;
  solutionRating: number;
  comment: string;
  createdAt: string;
}

export interface CreateSatisfactionSurveyInput {
  rating: number;
  communicationRating: number;
  solutionRating: number;
  comment?: string;
}

export const surveyService = {
  submitSurvey: async (ticketId: string, data: CreateSatisfactionSurveyInput): Promise<SatisfactionSurveyDto> => {
    const response = await api.post<SatisfactionSurveyDto>(`/tickets/${ticketId}/survey`, data);
    return response.data;
  },

  getSurvey: async (ticketId: string): Promise<SatisfactionSurveyDto | null> => {
    try {
      const response = await api.get<SatisfactionSurveyDto>(`/tickets/${ticketId}/survey`);
      return response.data;
    } catch {
      return null;
    }
  },
};