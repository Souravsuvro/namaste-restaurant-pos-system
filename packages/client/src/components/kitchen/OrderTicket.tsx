import { ChevronRight, UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Timer } from './Timer';
import type { Order, OrderStatus } from '@/types/order';

interface OrderTicketProps {
  order: Order;
  onBump: (orderId: string, nextStatus: OrderStatus) => void;
}

const orderTypeConfig = {
  dine_in: { label: 'Dine In', variant: 'info' as const, icon: UtensilsCrossed },
  takeaway: { label: 'Takeaway', variant: 'saffron' as const, icon: ShoppingBag },
  delivery: { label: 'Delivery', variant: 'success' as const, icon: Truck },
};

const nextStatus: Record<string, OrderStatus> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

export function OrderTicket({ order, onBump }: OrderTicketProps) {
  const typeConfig = orderTypeConfig[order.order_type];
  const TypeIcon = typeConfig.icon;
  const next = nextStatus[order.status];

  const bumpLabel =
    order.status === 'pending'
      ? 'Start'
      : order.status === 'preparing'
        ? 'Ready'
        : 'Served';

  const bumpVariant =
    order.status === 'pending'
      ? 'primary'
      : order.status === 'preparing'
        ? 'gold'
        : ('secondary' as const);

  return (
    <div className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-cream">#{order.order_number}</span>
          {order.table_number && (
            <span className="text-xs text-cream/50 bg-[#0f1f3d] px-2 py-0.5 rounded">
              T{order.table_number}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={typeConfig.variant} dot>
            <TypeIcon size={12} className="mr-1" />
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      {/* Timer */}
      <div className="px-4 py-2 bg-[#0f1f3d]/50">
        <Timer startTime={order.created_at} />
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-sm font-bold text-saffron min-w-[24px]">
              {item.quantity}x
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-cream">
                {item.menu_item_name || 'Item'}
              </p>
              {item.modifications && (
                <p className="text-xs text-gold mt-0.5">
                  {item.modifications}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-cream/40 italic mt-0.5">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 pt-2 border-t border-[#1e3a5f]">
            <p className="text-xs text-gold italic">Note: {order.notes}</p>
          </div>
        )}
      </div>

      {/* Bump button */}
      {next && (
        <div className="px-4 py-3 border-t border-[#1e3a5f]">
          <Button
            variant={bumpVariant as 'primary' | 'gold' | 'secondary'}
            size="lg"
            fullWidth
            onClick={() => onBump(order.id, next)}
            icon={<ChevronRight size={18} />}
          >
            {bumpLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
