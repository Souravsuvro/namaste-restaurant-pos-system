import apiClient from './client';
import type { LoginResponse, User, CreateUserPayload, UpdateUserPayload } from '@/types/auth';

export const authApi = {
  login: async (pin: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { pin });
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, payload);
    return data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
