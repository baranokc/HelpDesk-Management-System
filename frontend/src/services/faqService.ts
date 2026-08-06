import { api } from "@/src/lib/api";

export interface FaqItemDto {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreateFaqInput {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  displayOrder: number;
}

export interface ReorderFaqInput {
  id: string;
  displayOrder: number;
}

export const faqService = {
  getActiveFaqs: async (): Promise<FaqItemDto[]> => {
    const response = await api.get<FaqItemDto[]>("/faqs");
    return response.data;
  },

  getAllFaqsForAdmin: async (): Promise<FaqItemDto[]> => {
    const response = await api.get<FaqItemDto[]>("/faqs/admin");
    return response.data;
  },

  createFaq: async (data: CreateFaqInput): Promise<FaqItemDto> => {
    const response = await api.post<FaqItemDto>("/faqs", data);
    return response.data;
  },

  updateFaq: async (id: string, data: CreateFaqInput): Promise<FaqItemDto> => {
    const response = await api.put<FaqItemDto>(`/faqs/${id}`, data);
    return response.data;
  },

  reorderFaqs: async (items: ReorderFaqInput[]): Promise<void> => {
    await api.put("/faqs/reorder", items);
  },

  deleteFaq: async (id: string): Promise<void> => {
    await api.delete(`/faqs/${id}`);
  },
};