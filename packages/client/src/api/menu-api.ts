import apiClient from './client';
import type {
  MenuItem,
  Category,
  MenuFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
} from '@/types/menu';

export const menuApi = {
  getMenuItems: async (filters?: MenuFilters): Promise<MenuItem[]> => {
    const params = new URLSearchParams();
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.available !== undefined) params.append('available', String(filters.available));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_vegetarian) params.append('is_vegetarian', 'true');
    if (filters?.is_vegan) params.append('is_vegan', 'true');
    const { data } = await apiClient.get<MenuItem[]>(`/menu?${params.toString()}`);
    return data;
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const { data } = await apiClient.get<MenuItem>(`/menu/${id}`);
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/categories');
    return data;
  },

  createCategory: async (payload: { name: string; display_order?: number }): Promise<Category> => {
    const { data } = await apiClient.post<Category>('/categories', payload);
    return data;
  },

  updateCategory: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, payload);
    return data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  createMenuItem: async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
    const { data } = await apiClient.post<MenuItem>('/menu', payload);
    return data;
  },

  updateMenuItem: async (id: string, payload: UpdateMenuItemPayload): Promise<MenuItem> => {
    const { data } = await apiClient.put<MenuItem>(`/menu/${id}`, payload);
    return data;
  },

  toggleAvailability: async (id: string): Promise<MenuItem> => {
    const { data } = await apiClient.patch<MenuItem>(`/menu/${id}/availability`);
    return data;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/menu/${id}`);
  },
};
