import apiClient from './client';
import type { Table, TableStatus } from '@/types/table';

export const tablesApi = {
  getTables: async (): Promise<Table[]> => {
    const { data } = await apiClient.get<Table[]>('/tables');
    return data;
  },

  getTable: async (id: string): Promise<Table> => {
    const { data } = await apiClient.get<Table>(`/tables/${id}`);
    return data;
  },

  updateTableStatus: async (id: string, status: TableStatus): Promise<Table> => {
    const { data } = await apiClient.patch<Table>(`/tables/${id}/status`, { status });
    return data;
  },

  createTable: async (payload: {
    number: number;
    capacity: number;
    position_x?: number;
    position_y?: number;
  }): Promise<Table> => {
    const { data } = await apiClient.post<Table>('/tables', payload);
    return data;
  },

  updateTable: async (
    id: string,
    payload: Partial<Table>
  ): Promise<Table> => {
    const { data } = await apiClient.put<Table>(`/tables/${id}`, payload);
    return data;
  },

  deleteTable: async (id: string): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  },
};
