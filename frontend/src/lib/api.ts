import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3000',
});

// Response interceptor for better error handling if needed
api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
        } else {
            console.error('API Error:', error);
        }
        return Promise.reject(error);
    }
);
