import { useEffect } from 'react';
import { OrderQueue } from '@/components/kitchen/OrderQueue';
import { useOrderStore } from '@/store/order-store';
import { useActiveOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import type { OrderStatus } from '@/types/order';

export function Kitchen() {
  const { data: activeOrders } = useActiveOrders();
  const { kitchenQueue, setOrders } = useOrderStore();
  const updateStatus = useUpdateOrderStatus();

  useEffect(() => {
    if (activeOrders) {
      setOrders(activeOrders);
    }
  }, [activeOrders, setOrders]);

  const pendingOrders = kitchenQueue.filter((o) => o.status === 'pending');
  const preparingOrders = kitchenQueue.filter((o) => o.status === 'preparing');
  const readyOrders = kitchenQueue.filter((o) => o.status === 'ready');

  const handleBump = (orderId: string, nextStatus: OrderStatus) => {
    updateStatus.mutate({ id: orderId, status: nextStatus });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#1e3a5f]">
        <h1 className="text-xl font-bold text-cream">Kitchen Display</h1>
        <p className="text-sm text-cream/40 mt-0.5">
          {kitchenQueue.length} active order{kitchenQueue.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 p-4 min-h-0">
        <OrderQueue
          title="New Orders"
          orders={pendingOrders}
          headerColor="bg-gradient-to-r from-tandoori to-saffron"
          onBump={handleBump}
        />
        <OrderQueue
          title="Preparing"
          orders={preparingOrders}
          headerColor="bg-gradient-to-r from-gold/80 to-gold"
          onBump={handleBump}
        />
        <OrderQueue
          title="Ready"
          orders={readyOrders}
          headerColor="bg-gradient-to-r from-emerald-600 to-emerald-500"
          onBump={handleBump}
        />
      </div>
    </div>
  );
}
