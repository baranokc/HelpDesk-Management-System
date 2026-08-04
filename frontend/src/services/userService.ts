import { api } from "@/src/lib/api";
import type { UserListDto, UserUpdateRoleDto } from "@/src/types/user";

export const userService = {
  getAllUsers: async (): Promise<UserListDto[]> => {
    const response = await api.get<UserListDto[]>("/users");
    return response.data;
  },

  updateUserRole: async (dto: UserUpdateRoleDto): Promise<void> => {
    await api.put(`/users/${dto.userId}/role`, { newRole: dto.newRole });
  },
};