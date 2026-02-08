import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type {
  GitHubDashboard,
  GitHubUserListItem,
  GitHubDigest
} from '../types/github';
import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5010';

const api = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response error interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      logger.error(`API Error: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      logger.error('Network Error', error.message);
    } else {
      logger.error('Request Error', error.message);
    }
    return Promise.reject(error);
  }
);

export async function fetchDashboard(username: string): Promise<AxiosResponse<GitHubDashboard>> {
  return api.get<GitHubDashboard>(`/api/github/dashboard/${encodeURIComponent(username)}`);
}

export async function fetchUsersList(since?: number, perPage?: number): Promise<AxiosResponse<GitHubUserListItem[]>> {
  const params = new URLSearchParams();
  if (since !== undefined) params.set('since', String(since));
  if (perPage !== undefined) params.set('per_page', String(perPage));
  const q = params.toString();
  return api.get<GitHubUserListItem[]>(`/api/github/users${q ? `?${q}` : ''}`);
}

export async function fetchDigest(username: string, period: 'daily' | 'weekly' = 'daily'): Promise<AxiosResponse<GitHubDigest>> {
  return api.get<GitHubDigest>(`/api/github/digest/${encodeURIComponent(username)}?period=${period}`);
}

export default api;
