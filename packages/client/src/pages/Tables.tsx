import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Utensils, Sparkles } from 'lucide-react';
import { FloorPlan } from '@/components/tables/FloorPlan';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTables, useUpdateTableStatus } from '@/hooks/useTables';
import { useCartStore } from '@/store/cart-store';
import type { Table } from '@/types/table';

export function Tables() {
  const { data: tables, isLoading } = useTables();
  const updateTableStatus = useUpdateTableStatus();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const setCartTable = useCartStore((s) => s.setTable);
  const setOrderType = useCartStore((s) => s.setOrderType);
  const navigate = useNavigate();

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
  };

  const handleNewOrder = () => {
    if (!selectedTable) return;
    setCartTable(selectedTable.id);
    setOrderType('dine_in');
    navigate('/');
    setSelectedTable(null);
  };

  const handleMarkAvailable = () => {
    if (!selectedTable) return;
    updateTableStatus.mutate({ id: selectedTable.id, status: 'available' });
    setSelectedTable(null);
  };

  const handleMarkCleaning = () => {
    if (!selectedTable) return;
    updateTableStatus.mutate({ id: selectedTable.id, status: 'needs_cleaning' });
    setSelectedTable(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[#162a4a] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statusBadgeVariant = {
    available: 'success' as const,
    occupied: 'saffron' as const,
    reserved: 'info' as const,
    needs_cleaning: 'danger' as const,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#1e3a5f] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cream">Tables</h1>
          <p className="text-sm text-cream/40 mt-0.5">
            {tables?.filter((t) => t.status === 'available').length || 0} available of{' '}
            {tables?.length || 0}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <FloorPlan tables={tables || []} onTableClick={handleTableClick} />
      </div>

      {/* Table detail modal */}
      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`Table ${selectedTable?.number}`}
        size="sm"
      >
        {selectedTable && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-cream/60">Status</span>
              <Badge variant={statusBadgeVariant[selectedTable.status]} dot>
                {selectedTable.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-cream/60">Capacity</span>
              <span className="text-sm text-cream">{selectedTable.capacity} seats</span>
            </div>
            {selectedTable.current_order_total !== undefined && selectedTable.status === 'occupied' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-cream/60">Current Order</span>
                <span className="text-sm font-semibold text-saffron">
                  {'\u20AC'}{selectedTable.current_order_total.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-[#1e3a5f] pt-4 space-y-2">
              {selectedTable.status === 'available' && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Plus size={16} />}
                  onClick={handleNewOrder}
                >
                  New Order
                </Button>
              )}
              {selectedTable.status === 'occupied' && (
                <>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    icon={<Eye size={16} />}
                    onClick={handleNewOrder}
                  >
                    View / Add to Order
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    icon={<Utensils size={16} />}
                    className="border border-[#1e3a5f]"
                    onClick={handleMarkCleaning}
                  >
                    Mark Needs Cleaning
                  </Button>
                </>
              )}
              {selectedTable.status === 'needs_cleaning' && (
                <Button
                  variant="gold"
                  size="lg"
                  fullWidth
                  icon={<Sparkles size={16} />}
                  onClick={handleMarkAvailable}
                >
                  Mark as Clean
                </Button>
              )}
              {selectedTable.status === 'reserved' && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Plus size={16} />}
                  onClick={handleNewOrder}
                >
                  Seat Guests
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
