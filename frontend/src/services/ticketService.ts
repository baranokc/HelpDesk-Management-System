import { create } from "domain";
import { api } from "../lib/api";
import {
    TicketListDto,
    TicketDetailDto,
    TicketCreateDto,
    TicketUpdateDto,
    TicketFilterDto
} from '@/src/types/ticket';
export const ticketService = {
    getAll: async (filter?: TicketFilterDto): Promise<TicketListDto[]> => {
        const response = await api.get<TicketListDto[]>('/tickets', {
          params: filter,
        });
        return response.data;
      },
    getById: async (id : string): Promise<TicketDetailDto> => {
        const response = await api.get<TicketDetailDto>('/tickets/${id}');
        return response.data;
    },
    create: async (data: TicketCreateDto): Promise <string> => {
        const response = await api.post<string>('/tickets',data);
        return response.data;
    },
    update: async (id: string, data: TicketUpdateDto):Promise <void> =>{
        await api.put('/tickets/${id}', data);
    },
    delete: async (id: string):Promise <void> => {
        await api.put('/tickets/${id}')
    },
}