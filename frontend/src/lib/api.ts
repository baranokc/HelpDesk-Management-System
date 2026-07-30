import axios from 'axios';
import { error } from 'console';
import { config } from 'process';

export const api = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5269/api',
    headers : {
        'Content-Type' : 'application/json'
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = 'Bearer ${token}'
        }
    }
    return config;
},
    (error) => Promise.reject(error)
);
