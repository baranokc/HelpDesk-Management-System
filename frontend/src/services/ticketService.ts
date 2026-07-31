import { api } from '../lib/api';
import type { PagedResultDto } from '@/src/types/common';
import type {
  TicketListDto,
  TicketDetailDto,
  TicketCreateDto,
  TicketUpdateDto,
  TicketFilterDto,
  TicketResponseDto,
} from '@/src/types/ticket';

export const ticketService = {
  getAll: async (
    filterDto?: TicketFilterDto,
  ): Promise<PagedResultDto<TicketListDto>> => {
    const response = await api.get<PagedResultDto<TicketListDto>>(
      '/tickets',
      {
        params: filterDto,
      },
    );

    return response.data;
  },

  getById: async (id: string): Promise<TicketDetailDto> => {
    const response = await api.get<TicketDetailDto>(
      `/tickets/${id}`,
    );

    return response.data;
  },

  create: async (
    dto: TicketCreateDto,
  ): Promise<TicketResponseDto> => {
    const formData = new FormData();

    formData.append("ticketTitle", dto.ticketTitle);
    formData.append("subject", dto.subject);
    formData.append("ticketDescription", dto.ticketDescription);
    formData.append("categoryId", dto.categoryId);
    formData.append("priorityId", dto.priorityId);
    formData.append("impactLevelId", dto.impactLevelId);
    formData.append("urgencyLevelId", dto.urgencyLevelId);

    if (dto.subcategoryId) {
      formData.append("subcategoryId", dto.subcategoryId);
    }

    dto.attachments?.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const response = await api.post<TicketResponseDto>(
        "/tickets",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: [(data) => data],
        }
      );
      return response.data;
    } catch (err: any) {
      console.error("🔥 C# Backend 400 Detayı:", err.response?.data);
      throw err;
    }
  },

  update: async (id: string, dto: TicketUpdateDto): Promise<void> => {
    await api.put(`/tickets/${id}`, dto);
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },

  addComment: async (ticketId: string, comment: string) => {
    const response = await api.post(`/tickets/${ticketId}/comments`, { 
      comment: comment 
    });
    return response.data;
  }
};