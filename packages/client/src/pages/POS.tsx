import { useState } from 'react';
import { Search, UtensilsCrossed, ShoppingBag, Truck, MapPin } from 'lucide-react';
import { CategoryBar } from '@/components/pos/CategoryBar';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { useCartStore } from '@/store/cart-store';
import { useCreateOrder, useCreatePayment } from '@/hooks/useOrders';
import { useTables } from '@/hooks/useTables';
import { useTableStore } from '@/store/table-store';
import type { OrderType, PaymentMethod } from '@/types/order';

const orderTypes: { value: OrderType; label: string; icon: React.ReactNode }[] = [
  { value: 'dine_in', label: 'Dine In', icon: <UtensilsCrossed size={16} /> },
  { value: 'takeaway', label: 'Takeaway', icon: <ShoppingBag size={16} /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck size={16} /> },
];

export function POS() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showTableSelect, setShowTableSelect] = useState(false);

  const {
    items,
    orderType,
    tableId,
    notes,
    setOrderType,
    setTable,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
  } = useCartStore();

  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();
  const { data: _tablesData } = useTables();
  const tables = useTableStore((s) => s.tables);

  const handlePay = () => {
    if (items.length === 0) return;
    setShowPayment(true);
  };

  const handleHold = async () => {
    if (items.length === 0) return;
    try {
      await createOrder.mutateAsync({
        table_id: tableId || undefined,
        order_type: orderType,
        notes: notes || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          modifications: item.modifications.length > 0 ? item.modifications.join(', ') : undefined,
          notes: item.notes || undefined,
        })),
        discount_amount: getDiscountAmount(),
      });
      clearCart();
    } catch {
      // handled by hook
    }
  };

  const handlePaymentComplete = async (
    method: PaymentMethod,
    amountTendered: number,
    tip: number
  ) => {
    try {
      const order = await createOrder.mutateAsync({
        table_id: tableId || undefined,
        order_type: orderType,
        notes: notes || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          modifications: item.modifications.length > 0 ? item.modifications.join(', ') : undefined,
          notes: item.notes || undefined,
        })),
        discount_amount: getDiscountAmount(),
      });

      await createPayment.mutateAsync({
        order_id: order.id,
        amount: amountTendered,
        method,
        tip_amount: tip,
      });

      setShowPayment(false);
      clearCart();
    } catch {
      // handled by hooks
    }
  };

  return (
    <div className="flex h-full">
      {/* Left side - Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#162a4a] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-saffron/50 transition-colors"
            />
          </div>
        </div>

        {/* Category bar */}
        <div className="px-4 pb-3">
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <MenuGrid categoryId={selectedCategory} searchQuery={searchQuery} />
        </div>

        {/* Bottom bar */}
        <div className="px-4 py-3 border-t border-[#1e3a5f] bg-[#0a1628] flex items-center gap-3">
          {/* Order type toggle */}
          <div className="flex bg-[#162a4a] rounded-xl border border-[#1e3a5f] p-1">
            {orderTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setOrderType(type.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${
                    orderType === type.value
                      ? 'bg-saffron text-white shadow-sm'
                      : 'text-cream/50 hover:text-cream/70'
                  }
                `}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>

          {/* Table selector */}
          {orderType === 'dine_in' && (
            <div className="relative">
              <button
                onClick={() => setShowTableSelect(!showTableSelect)}
                className="flex items-center gap-2 px-3 py-2.5 bg-[#162a4a] border border-[#1e3a5f] rounded-xl text-xs font-medium text-cream/70 hover:border-cream/30 transition-colors"
              >
                <MapPin size={14} />
                {tableId
                  ? `Table ${tables.find((t) => t.id === tableId)?.number || tableId}`
                  : 'Select Table'}
              </button>
              {showTableSelect && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#162a4a] border border-[#1e3a5f] rounded-xl shadow-xl p-2 min-w-[200px] z-50 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setTable(null);
                      setShowTableSelect(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-cream/50 hover:bg-[#1a3052] transition-colors"
                  >
                    No table
                  </button>
                  {tables
                    .filter((t) => t.status === 'available')
                    .sort((a, b) => a.number - b.number)
                    .map((table) => (
                      <button
                        key={table.id}
                        onClick={() => {
                          setTable(table.id);
                          setShowTableSelect(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                          tableId === table.id
                            ? 'bg-saffron/20 text-saffron'
                            : 'text-cream/70 hover:bg-[#1a3052]'
                        }`}
                      >
                        Table {table.number} ({table.capacity} seats)
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-[380px] flex-shrink-0">
        <CartPanel
          onPay={handlePay}
          onHold={handleHold}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
