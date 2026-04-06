import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useOrders } from '@/hooks/useOrders';
import type { OrderStatus, OrderType } from '@/types/order';

const statusVariant: Record<OrderStatus, 'default' | 'warning' | 'saffron' | 'success' | 'info' | 'danger'> = {
  pending: 'warning',
  preparing: 'saffron',
  ready: 'success',
  served: 'info',
  completed: 'default',
  cancelled: 'danger',
};

const orderTypeLabel: Record<OrderType, string> = {
  dine_in: 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
};

export function Orders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<OrderType | ''>('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useOrders({
    status: statusFilter || undefined,
    order_type: typeFilter || undefined,
    page,
    limit: 20,
  });

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#1e3a5f]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-cream">Orders</h1>
            <p className="text-sm text-cream/40 mt-0.5">{total} total orders</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Filter size={14} />}
            onClick={() => setShowFilters(!showFilters)}
            className="border border-[#1e3a5f]"
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-3 animate-slide-in">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | '');
                setPage(1);
              }}
              className="bg-[#162a4a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as OrderType | '');
                setPage(1);
              }}
              className="bg-[#162a4a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
            >
              <option value="">All Types</option>
              <option value="dine_in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[#162a4a] animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-cream/30">
            <Search size={40} strokeWidth={1} />
            <p className="mt-3 text-sm">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e3a5f]">
            {orders.map((order) => (
              <div key={order.id}>
                <button
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#162a4a]/50 transition-colors text-left"
                >
                  <div className="min-w-[60px]">
                    <span className="text-sm font-bold text-cream">#{order.order_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[order.status]} dot>
                        {order.status}
                      </Badge>
                      <span className="text-xs text-cream/40">
                        {orderTypeLabel[order.order_type]}
                      </span>
                      {order.table_number && (
                        <span className="text-xs text-cream/40">
                          Table {order.table_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-cream/40">
                      <Clock size={14} />
                      <span>
                        {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="font-semibold text-cream min-w-[70px] text-right">
                      {'\u20AC'}{order.total.toFixed(2)}
                    </span>
                    {expandedOrder === order.id ? (
                      <ChevronUp size={16} className="text-cream/40" />
                    ) : (
                      <ChevronDown size={16} className="text-cream/40" />
                    )}
                  </div>
                </button>

                {expandedOrder === order.id && (
                  <div className="px-6 pb-4 animate-slide-in">
                    <div className="bg-[#0f1f3d] rounded-xl border border-[#1e3a5f] p-4">
                      <div className="space-y-2 mb-3">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-saffron font-bold">{item.quantity}x</span>
                              <span className="text-cream">{item.menu_item_name || 'Item'}</span>
                              {item.modifications && (
                                <span className="text-xs text-gold">({item.modifications})</span>
                              )}
                            </div>
                            <span className="text-cream/60">
                              {'\u20AC'}{(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[#1e3a5f] pt-2 space-y-1 text-sm">
                        <div className="flex justify-between text-cream/50">
                          <span>Subtotal</span>
                          <span>{'\u20AC'}{order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Discount</span>
                            <span>-{'\u20AC'}{order.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-cream/50">
                          <span>Tax</span>
                          <span>{'\u20AC'}{order.tax_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-cream">
                          <span>Total</span>
                          <span className="text-saffron">{'\u20AC'}{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      {order.notes && (
                        <p className="mt-2 text-xs text-gold italic">Note: {order.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-[#1e3a5f] flex items-center justify-between">
          <span className="text-sm text-cream/40">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border border-[#1e3a5f]"
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="border border-[#1e3a5f]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
