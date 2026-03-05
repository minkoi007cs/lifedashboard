import axios from 'axios';

let envApiUrl = (window as any).env?.VITE_API_URL;
if (envApiUrl === '__VITE_API_URL__') envApiUrl = undefined;
const apiUrl = envApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
