import { api } from "../lib/api";
import {
  TicketListDto,
  TicketDetailDto,
  TicketCreateDto,
  TicketUpdateDto,
  TicketFilterDto,
} from '@/src/types/ticket';

export const ticketService = {
  getAll: async (filterDto?: TicketFilterDto): Promise<TicketListDto[]> => {
    const response = await api.get<TicketListDto[]>('/tickets', {
      params: filterDto,
    });
    return response.data;
  },
  getById: async (id: string): Promise<TicketDetailDto> => {
    const response = await api.get<TicketDetailDto>(`/tickets/${id}`);
    return response.data;
  },
  create: async (dto: TicketCreateDto): Promise<string> => {
    const response = await api.post<string>('/tickets', dto);
    return response.data;
  },
  update: async (id: string, dto: TicketUpdateDto): 
    Promise<void> => {await api.put(`/tickets/${id}`, dto);
  },
  delete: async (id: string): 
    Promise<void> => {await api.delete(`/tickets/${id}`);
  },
};