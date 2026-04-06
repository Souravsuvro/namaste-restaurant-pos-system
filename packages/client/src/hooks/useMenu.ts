import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/api/menu-api';
import type { MenuFilters, CreateMenuItemPayload, UpdateMenuItemPayload } from '@/types/menu';
import toast from 'react-hot-toast';

export function useMenuItems(filters?: MenuFilters) {
  return useQuery({
    queryKey: ['menu', filters],
    queryFn: () => menuApi.getMenuItems(filters),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => menuApi.createMenuItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create item: ${error.message}`);
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuItemPayload }) =>
      menuApi.updateMenuItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => menuApi.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle availability: ${error.message}`);
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => menuApi.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}
