export interface ProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  teamName?: string | null;
  departmentName?: string | null;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
