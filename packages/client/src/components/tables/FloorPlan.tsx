import { TableCard } from './TableCard';
import { TableStatusLegend } from './TableStatus';
import type { Table } from '@/types/table';

interface FloorPlanProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
}

export function FloorPlan({ tables, onTableClick }: FloorPlanProps) {
  const sortedTables = [...tables].sort((a, b) => a.number - b.number);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cream">Floor Plan</h2>
        <TableStatusLegend />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sortedTables.map((table) => (
          <TableCard key={table.id} table={table} onClick={onTableClick} />
        ))}
      </div>
      {tables.length === 0 && (
        <div className="flex items-center justify-center h-48 text-cream/30 text-sm">
          No tables configured
        </div>
      )}
    </div>
  );
}
