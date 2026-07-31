import { api } from '../lib/api';
import {
  TicketListDto,
  TicketDetailDto,
  TicketCreateDto,
  TicketUpdateDto,
  TicketFilterDto,
  TicketResponseDto,
} from '@/src/types/ticket';

// 🧪 TEST İÇİN GEÇİCİ VERİLER (Mock Data)
const MOCK_TICKETS: TicketListDto[] = [
  {
    id: '1',
    ticketNumber: 'TCK-1001',
    ticketTitle: 'VPN Connection Fails on macOS Sequoia',
    statusName: 'Open',
    priorityName: 'High',
    categoryName: 'Network & Security',
    subcategoryName: 'VPN Access',
    createdByName: 'Süleyman Okçuoğlu',
    assignedToName: 'Ahmet Yılmaz',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    ticketNumber: 'TCK-1002',
    ticketTitle: 'Database Connection Timeout on Peak Hours',
    statusName: 'In Progress',
    priorityName: 'Critical',
    categoryName: 'Infrastructure',
    subcategoryName: 'Database Server',
    createdByName: 'Zeynep Kaya',
    assignedToName: 'Caner Demir',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    ticketNumber: 'TCK-1003',
    ticketTitle: 'Request for New License Key (Figma Pro)',
    statusName: 'Resolved',
    priorityName: 'Medium',
    categoryName: 'Software Request',
    subcategoryName: null,
    createdByName: 'Burak Şahin',
    assignedToName: 'Ayşe Tekin',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    ticketNumber: 'TCK-1004',
    ticketTitle: 'Printer Driver Installation Issue',
    statusName: 'Closed',
    priorityName: 'Low',
    categoryName: 'Hardware',
    subcategoryName: 'Printer Maintenance',
    createdByName: 'Elif Arslan',
    assignedToName: null,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export const ticketService = {
  getAll: async (filterDto?: TicketFilterDto): Promise<TicketListDto[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_TICKETS;

  },

  getById: async (id: string): Promise<TicketDetailDto> => {
    const response = await api.get<TicketDetailDto>(`/tickets/${id}`);
    return response.data;
  },

create: async (
  dto: TicketCreateDto,
): Promise<TicketResponseDto> => {
  const formData = new FormData();

  formData.append("TicketTitle", dto.ticketTitle);
  formData.append(
    "TicketDescription",
    dto.ticketDescription,
  );
  formData.append("Subject", dto.subject);
  formData.append("CategoryId", dto.categoryId);
  formData.append("PriorityId", dto.priorityId);
  formData.append(
    "ImpactLevelId",
    dto.impactLevelId,
  );
  formData.append(
    "UrgencyLevelId",
    dto.urgencyLevelId,
  );

  if (dto.subcategoryId) {
    formData.append(
      "SubcategoryId",
      dto.subcategoryId,
    );
  }

  dto.attachments.forEach((file) => {
    formData.append("Attachments", file);
  });

  const response = await api.post<TicketResponseDto>(
    "/tickets",
    formData,
  );

  return response.data;
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