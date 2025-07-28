import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { handleApiError, retryOperation } from './errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(handleApiError(refreshError, false));
          }
        }

        // Handle and transform the error
        return Promise.reject(handleApiError(error, false));
      }
    );
  }

  async get<T = any>(url: string, retry: boolean = true): Promise<AxiosResponse<T>> {
    if (retry) {
      return retryOperation(() => this.client.get(url));
    }
    return this.client.get(url);
  }

  async post<T = any>(url: string, data?: any, retry: boolean = false): Promise<AxiosResponse<T>> {
    if (retry) {
      return retryOperation(() => this.client.post(url, data));
    }
    return this.client.post(url, data);
  }

  async put<T = any>(url: string, data?: any, retry: boolean = false): Promise<AxiosResponse<T>> {
    if (retry) {
      return retryOperation(() => this.client.put(url, data));
    }
    return this.client.put(url, data);
  }

  async delete<T = any>(url: string, retry: boolean = false): Promise<AxiosResponse<T>> {
    if (retry) {
      return retryOperation(() => this.client.delete(url));
    }
    return this.client.delete(url);
  }

  async patch<T = any>(url: string, data?: any, retry: boolean = false): Promise<AxiosResponse<T>> {
    if (retry) {
      return retryOperation(() => this.client.patch(url, data));
    }
    return this.client.patch(url, data);
  }
}

export const apiClient = new ApiClient();