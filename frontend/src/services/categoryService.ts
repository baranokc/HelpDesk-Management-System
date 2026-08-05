import { api } from "@/src/lib/api";
import type {
  CategoryDto,
  CategoryTeamAssignmentDto,
  CategoryUpsertDto,
  SubcategoryUpsertDto,
} from "@/src/types/category";

export const categoryService = {
  getAll: async (): Promise<CategoryDto[]> => {
    const response = await api.get<CategoryDto[]>("/categories");
    return response.data;
  },

  create: async (dto: CategoryUpsertDto): Promise<CategoryDto> => {
    const response = await api.post<CategoryDto>("/categories", dto);
    return response.data;
  },

  update: async (id: string, dto: CategoryUpsertDto): Promise<CategoryDto> => {
    const response = await api.put<CategoryDto>(`/categories/${id}`, dto);
    return response.data;
  },

  setDefaultTeam: async (
    id: string,
    dto: CategoryTeamAssignmentDto,
  ): Promise<CategoryDto> => {
    const response = await api.put<CategoryDto>(`/categories/${id}/team`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  createSubcategory: async (
    categoryId: string,
    dto: SubcategoryUpsertDto,
  ): Promise<CategoryDto> => {
    const response = await api.post<CategoryDto>(
      `/categories/${categoryId}/subcategories`,
      dto,
    );
    return response.data;
  },

  updateSubcategory: async (
    categoryId: string,
    subcategoryId: string,
    dto: SubcategoryUpsertDto,
  ): Promise<CategoryDto> => {
    const response = await api.put<CategoryDto>(
      `/categories/${categoryId}/subcategories/${subcategoryId}`,
      dto,
    );
    return response.data;
  },

  deleteSubcategory: async (
    categoryId: string,
    subcategoryId: string,
  ): Promise<CategoryDto> => {
    const response = await api.delete<CategoryDto>(
      `/categories/${categoryId}/subcategories/${subcategoryId}`,
    );
    return response.data;
  },
};

export default categoryService;
