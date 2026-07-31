import axios from 'axios';
import { authService } from '../services/authService';
import { error } from 'console';
import { config } from 'process';

export const api = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5269/api',
    headers : {
        'Content-Type' : 'application/json',
    },
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
