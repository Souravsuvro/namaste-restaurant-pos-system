import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@/api/tables-api';
import type { TableStatus } from '@/types/table';
import { useTableStore } from '@/store/table-store';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useTables() {
  const setTables = useTableStore((state) => state.setTables);

  const query = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesApi.getTables(),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (query.data) {
      setTables(query.data);
    }
  }, [query.data, setTables]);

  return query;
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      tablesApi.updateTableStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update table: ${error.message}`);
    },
  });
}
