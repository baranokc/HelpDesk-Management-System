import axios from 'axios';
import { authService } from '../services/authService';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5269/api',
    withCredentials: true,
});

api.interceptors.request.use((config) => { 
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    return config;
},
    (error) => { 
        return Promise.reject(error);
    }
);
api.interceptors.response.use(
    (response)=> response,
    (error) => {
        if (error.response && error.response.status == 401) {
            authService.logout();
            if(typeof window != 'undefined' && !window.location.pathname.includes('/login')){
                window.location.href = '/login';
        }
    }
    return Promise.reject(error);
}
);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getFirstValidationMessage(errors: unknown): string | undefined {
    if (!isRecord(errors)) {
        return undefined;
    }

    for (const value of Object.values(errors)) {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }

        if (Array.isArray(value)) {
            const message = value.find(
                (item): item is string =>
                    typeof item === 'string' && Boolean(item.trim()),
            );

            if (message) {
                return message;
            }
        }
    }

    return undefined;
}

export function getApiErrorMessage(
    requestError: unknown,
    fallbackMessage: string,
): string {
    if (!axios.isAxiosError(requestError)) {
        return requestError instanceof Error && requestError.message
            ? requestError.message
            : fallbackMessage;
    }

    const data: unknown = requestError.response?.data;

    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    if (!isRecord(data)) {
        return fallbackMessage;
    }

    if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
    }

    const validationMessage = getFirstValidationMessage(data.errors);
    if (validationMessage) {
        return validationMessage;
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
    }

    if (typeof data.title === 'string' && data.title.trim()) {
        return data.title;
    }

    return fallbackMessage;
}
