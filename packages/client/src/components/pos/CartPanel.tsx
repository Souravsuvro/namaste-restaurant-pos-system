import { ShoppingCart, Trash2, Pause } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { CartItem } from './CartItem';
import { Button } from '@/components/ui/Button';

interface CartPanelProps {
  onPay: () => void;
  onHold: () => void;
  orderNumber?: number;
}

export function CartPanel({ onPay, onHold, orderNumber }: CartPanelProps) {
  const { items, tableId, clearCart, getSubtotal, getTax, getDiscountAmount, getTotal } =
    useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const discountAmount = getDiscountAmount();
  const total = getTotal();

  return (
    <div className="flex flex-col h-full bg-[#12243f] border-l border-[#1e3a5f]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-saffron" />
          <span className="font-semibold text-cream">
            {orderNumber ? `Order #${orderNumber}` : 'New Order'}
          </span>
        </div>
        {tableId && (
          <span className="text-xs text-cream/50 bg-indigo/20 px-2 py-1 rounded-lg">
            Table {tableId}
          </span>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-cream/30">
            <ShoppingCart size={48} strokeWidth={1} />
            <p className="mt-3 text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Tap items to add them</p>
          </div>
        ) : (
          <div className="py-2">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-[#1e3a5f] px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm text-cream/60">
            <span>Subtotal</span>
            <span>{'\u20AC'}{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-400">
              <span>Discount</span>
              <span>-{'\u20AC'}{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-cream/60">
            <span>TVA (10%)</span>
            <span>{'\u20AC'}{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-cream pt-1 border-t border-[#1e3a5f]">
            <span>Total</span>
            <span className="text-saffron">{'\u20AC'}{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-[#1e3a5f] space-y-2">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={clearCart}
            icon={<Trash2 size={16} />}
            disabled={items.length === 0}
            className="flex-1 border border-[#1e3a5f]"
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onHold}
            icon={<Pause size={16} />}
            disabled={items.length === 0}
            className="flex-1"
          >
            Hold
          </Button>
        </div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onPay}
          disabled={items.length === 0}
          className="text-base font-bold"
        >
          Pay {'\u20AC'}{total.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
