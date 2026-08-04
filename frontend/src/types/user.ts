export interface UserListDto {
    id: string;
    fullName: string;
    email: string;
    role: string;
    teamId?: string | null;
    teamName?: string | null;
    createdAt: string;
  }
  
  export interface UserUpdateRoleDto {
    userId: string;
    newRole: string;
  }