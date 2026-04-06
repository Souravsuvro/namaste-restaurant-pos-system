import apiClient from './client';
import type {
  Order,
  OrderFilters,
  CreateOrderPayload,
  UpdateOrderPayload,
  OrderStatus,
  OrderItemStatus,
  CreatePaymentPayload,
  Payment,
} from '@/types/order';

export const ordersApi = {
  getOrders: async (filters?: OrderFilters): Promise<{ orders: Order[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.order_type) params.append('order_type', filters.order_type);
    if (filters?.table_id) params.append('table_id', filters.table_id);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const { data } = await apiClient.get(`/orders?${params.toString()}`);
    return data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await apiClient.post<Order>('/orders', payload);
    return data;
  },

  updateOrder: async (id: string, payload: UpdateOrderPayload): Promise<Order> => {
    const { data } = await apiClient.put<Order>(`/orders/${id}`, payload);
    return data;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  },

  addOrderItems: async (
    orderId: string,
    items: {
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      modifications?: string;
      notes?: string;
    }[]
  ): Promise<Order> => {
    const { data } = await apiClient.post<Order>(`/orders/${orderId}/items`, { items });
    return data;
  },

  removeOrderItem: async (orderId: string, itemId: string): Promise<Order> => {
    const { data } = await apiClient.delete<Order>(`/orders/${orderId}/items/${itemId}`);
    return data;
  },

  updateItemStatus: async (
    orderId: string,
    itemId: string,
    status: OrderItemStatus
  ): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/orders/${orderId}/items/${itemId}/status`, {
      status,
    });
    return data;
  },

  holdOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/hold`);
    return data;
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const { data } = await apiClient.post<Payment>('/payments', payload);
    return data;
  },

  getActiveOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>('/orders/active');
    return data;
  },
};
