import { api } from "@/src/lib/api";
import type {
  ChangePasswordDto,
  ProfileDto,
  UpdateProfileDto,
} from "@/src/types/profile";

export const profileService = {
  getProfile: async (): Promise<ProfileDto> => {
    const response = await api.get<ProfileDto>("/profile");
    return response.data;
  },

  updateProfile: async (dto: UpdateProfileDto): Promise<ProfileDto> => {
    const response = await api.put<ProfileDto>("/profile", dto);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<ProfileDto> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ProfileDto>(
      "/profile/avatar",
      formData,
    );

    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await api.delete("/profile/avatar");
  },

  changePassword: async (dto: ChangePasswordDto): Promise<void> => {
    await api.put("/profile/password", dto);
  },
};
