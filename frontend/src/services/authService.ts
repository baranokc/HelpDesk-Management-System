import { api } from "../lib/api";
import {
    UserCreate,
    Login,
    UserResponse,
    LoginResponse
} from '@/src/types/auth';

export const authService = {
    login : async (dto : Login):
    Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login',dto);

        if (response.data.token){
            localStorage.setItem('token', response.data.token);
        }
    return response.data;
    },
    register : async (dto : UserCreate):
    Promise<UserResponse> => {
        const response = await api.post<UserResponse>('/auth/register',dto);
        return response.data;
    },
    forgotPassword: async (email: string):
    Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>(
            '/auth/forgot-password',
            { email }
        );
        return response.data;
    },
    resetPassword: async (dto: {
        email: string;
        token: string;
        newPassword: string;
        confirmNewPassword: string;
    }): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>(
            '/auth/reset-password',
            dto
        );
        return response.data;
    },
    refreshSession: async (): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/refresh');

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }

        return response.data;
    },
    logout: (): void => {
        localStorage.removeItem('token');
    },
    getToken: (): string | null => {
        if (typeof window !== 'undefined'){
            return localStorage.getItem('token');
        }
        return null;
    },
};
