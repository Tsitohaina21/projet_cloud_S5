import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '@/config/api';
import authService from './authService';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Ajouter le token à chaque requête (version correcte avec await)
    this.api.interceptors.request.use(async (config) => {
      const user = authService.getCurrentUser();
      if (user) {
        try {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
      return config;
    });

    // Gérer les erreurs
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expiré
          authService.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: any) {
    return this.api.patch(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }
}

export default new ApiService();
