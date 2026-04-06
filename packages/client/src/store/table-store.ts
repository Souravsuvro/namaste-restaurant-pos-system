import { create } from 'zustand';
import type { Table } from '@/types/table';

interface TableStore {
  tables: Table[];
  setTables: (tables: Table[]) => void;
  updateTable: (table: Table) => void;
}

export const useTableStore = create<TableStore>()((set, get) => ({
  tables: [],

  setTables: (tables: Table[]) => set({ tables }),

  updateTable: (table: Table) => {
    const { tables } = get();
    const exists = tables.find((t) => t.id === table.id);
    if (exists) {
      set({ tables: tables.map((t) => (t.id === table.id ? table : t)) });
    } else {
      set({ tables: [...tables, table] });
    }
  },
}));
