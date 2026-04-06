import { OrderTicket } from './OrderTicket';
import type { Order, OrderStatus } from '@/types/order';

interface OrderQueueProps {
  title: string;
  orders: Order[];
  headerColor: string;
  onBump: (orderId: string, nextStatus: OrderStatus) => void;
}

export function OrderQueue({ title, orders, headerColor, onBump }: OrderQueueProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div
        className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${headerColor}`}
      >
        <h2 className="text-base font-bold text-white">{title}</h2>
        <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {orders.length}
        </span>
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#0a1628] rounded-b-xl border border-t-0 border-[#1e3a5f]">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-cream/20 text-sm">
            No orders
          </div>
        ) : (
          orders.map((order) => (
            <OrderTicket key={order.id} order={order} onBump={onBump} />
          ))
        )}
      </div>
    </div>
  );
}
