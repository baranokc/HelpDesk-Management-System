export interface CategoryDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  defaultTeamId: string | null;
  defaultTeamName: string | null;
  subcategoryCount: number;
  subcategories: SubcategoryDto[];
}

export interface SubcategoryDto {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CategoryUpsertDto {
  name: string;
  description?: string;
  defaultTeamId?: string | null;
}

export interface CategoryTeamAssignmentDto {
  teamId: string | null;
}

export interface SubcategoryUpsertDto {
  name: string;
  description?: string;
}
