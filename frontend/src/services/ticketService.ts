import { api } from "../lib/api";
import type {
  TicketPagedResultDto,
  TicketDetailDto,
  TicketCreateDto,
  TicketUpdateDto,
  TicketFilterDto,
  TicketResponseDto,
} from "@/src/types/ticket";

export const ticketService = {
  getAll: async (
    filterDto?: TicketFilterDto,
  ): Promise<TicketPagedResultDto> => {
    const response = await api.get<TicketPagedResultDto>("/tickets", {
      params: filterDto,
    });

    return response.data;
  },

  getById: async (id: string): Promise<TicketDetailDto> => {
    const response = await api.get<TicketDetailDto>(`/tickets/${id}`);

    return response.data;
  },

  create: async (dto: TicketCreateDto): Promise<TicketResponseDto> => {
    const formData = new FormData();

    formData.append("TicketTitle", dto.ticketTitle);
    formData.append("Subject", dto.subject);
    formData.append("TicketDescription", dto.ticketDescription);
    formData.append("CategoryId", dto.categoryId);
    formData.append("PriorityId", dto.priorityId);
    formData.append("ImpactLevelId", dto.impactLevelId);
    formData.append("UrgencyLevelId", dto.urgencyLevelId);

    if (dto.subcategoryId) {
      formData.append("SubcategoryId", dto.subcategoryId);
    }

    dto.attachments.forEach((file) => {
      formData.append("Attachments", file);
    });

    const response = await api.post<TicketResponseDto>("/tickets", formData);

    return response.data;
  },

  update: async (id: string, dto: TicketUpdateDto): Promise<void> => {
    await api.put(`/tickets/${id}`, dto);
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },
};
