import { Minus, Plus, X } from 'lucide-react';
import { useCartStore, type CartItem as CartItemType } from '@/store/cart-store';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const lineTotal = item.menuItem.price * item.quantity;

  return (
    <div className="group relative flex items-start gap-3 py-3 border-b border-[#1e3a5f]/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium text-cream truncate pr-2">
            {item.menuItem.name}
          </h4>
          <span className="text-sm font-semibold text-cream flex-shrink-0">
            {'\u20AC'}{lineTotal.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-cream/40 mt-0.5">
          {'\u20AC'}{item.menuItem.price.toFixed(2)} each
        </p>
        {item.modifications.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.modifications.map((mod, i) => (
              <span
                key={i}
                className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded"
              >
                {mod}
              </span>
            ))}
          </div>
        )}
        {item.notes && (
          <p className="text-[10px] text-cream/30 mt-1 italic">
            Note: {item.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-7 h-7 rounded-lg bg-[#0f1f3d] border border-[#1e3a5f] flex items-center justify-center text-cream/60 hover:text-cream hover:border-cream/30 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-cream">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-[#0f1f3d] border border-[#1e3a5f] flex items-center justify-center text-cream/60 hover:text-cream hover:border-cream/30 transition-colors"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-cream/30 hover:text-tandoori hover:bg-tandoori/10 transition-colors ml-1"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
