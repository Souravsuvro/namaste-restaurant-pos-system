import apiClient from './client';

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface PopularItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategoryRevenue {
  category_id: string;
  category_name: string;
  revenue: number;
  percentage: number;
}

export interface PeakHour {
  hour: number;
  orders: number;
  revenue: number;
}

export interface SummaryStats {
  total_revenue: number;
  orders_today: number;
  avg_order_value: number;
  table_turnover: number;
}

export const reportsApi = {
  getDailySales: async (from?: string, to?: string): Promise<DailySales[]> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const { data } = await apiClient.get(`/reports/daily-sales?${params.toString()}`);
    return data;
  },

  getPopularItems: async (limit?: number): Promise<PopularItem[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const { data } = await apiClient.get(`/reports/popular-items${params}`);
    return data;
  },

  getCategoryRevenue: async (): Promise<CategoryRevenue[]> => {
    const { data } = await apiClient.get('/reports/category-revenue');
    return data;
  },

  getPeakHours: async (): Promise<PeakHour[]> => {
    const { data } = await apiClient.get('/reports/peak-hours');
    return data;
  },

  getSummary: async (): Promise<SummaryStats> => {
    const { data } = await apiClient.get('/reports/summary');
    return data;
  },
};
