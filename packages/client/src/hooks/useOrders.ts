import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders-api';
import type {
  OrderFilters,
  CreateOrderPayload,
  OrderStatus,
  CreatePaymentPayload,
} from '@/types/order';
import toast from 'react-hot-toast';

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters),
    refetchInterval: 30000,
  });
}

export function useActiveOrders() {
  return useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () => ordersApi.getActiveOrders(),
    refetchInterval: 10000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });
}

export function useAddOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      items,
    }: {
      orderId: string;
      items: {
        menu_item_id: string;
        quantity: number;
        unit_price: number;
        modifications?: string;
        notes?: string;
      }[];
    }) => ordersApi.addOrderItems(orderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Items added to order');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add items: ${error.message}`);
    },
  });
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      ordersApi.removeOrderItem(orderId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => ordersApi.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Payment completed');
    },
    onError: (error: Error) => {
      toast.error(`Payment failed: ${error.message}`);
    },
  });
}
