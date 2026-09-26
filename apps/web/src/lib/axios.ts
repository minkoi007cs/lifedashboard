import axios from 'axios';
import { getApiBaseUrl } from './api-config';
import { getAccessToken } from './supabase';

const api = axios.create({
    baseURL: getApiBaseUrl(),
});

api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
