import axios from 'axios';

// VITE_API_URL is baked in at build time by Vite.
// Set it in .env.local for local dev, and in Vercel environment variables for production.
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
