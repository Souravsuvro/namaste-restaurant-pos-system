import { Users } from 'lucide-react';
import { TableStatusIndicator } from './TableStatus';
import type { Table } from '@/types/table';

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
}

const borderColors = {
  available: 'border-emerald-500/40 hover:border-emerald-400',
  occupied: 'border-saffron/40 hover:border-saffron',
  reserved: 'border-indigo/40 hover:border-indigo',
  needs_cleaning: 'border-tandoori/40 hover:border-tandoori',
};

const bgColors = {
  available: 'bg-emerald-500/5',
  occupied: 'bg-saffron/5',
  reserved: 'bg-indigo/5',
  needs_cleaning: 'bg-tandoori/5',
};

export function TableCard({ table, onClick }: TableCardProps) {
  return (
    <button
      onClick={() => onClick(table)}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200
        ${borderColors[table.status]} ${bgColors[table.status]}
        bg-[#162a4a] hover:shadow-lg active:scale-[0.98]
        min-h-[120px] flex flex-col items-center justify-center gap-2
      `}
    >
      <div className="absolute top-2 right-2">
        <TableStatusIndicator status={table.status} size="sm" />
      </div>
      <span className="text-2xl font-bold text-cream">{table.number}</span>
      <div className="flex items-center gap-1 text-cream/50">
        <Users size={14} />
        <span className="text-xs">{table.capacity}</span>
      </div>
      {table.status === 'occupied' && table.current_order_total !== undefined && (
        <div className="mt-1 text-sm font-semibold text-saffron">
          {'\u20AC'}{table.current_order_total.toFixed(2)}
        </div>
      )}
    </button>
  );
}
