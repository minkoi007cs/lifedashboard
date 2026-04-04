import axios from 'axios';
import { getApiBaseUrl } from './api-config';

const api = axios.create({
    baseURL: getApiBaseUrl(),
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
