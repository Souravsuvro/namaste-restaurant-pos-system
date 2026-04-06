import { create } from 'zustand';
import type { MenuItem } from '@/types/menu';
import type { OrderType } from '@/types/order';

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifications: string[];
  notes: string;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  orderType: OrderType;
  notes: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  addItem: (menuItem: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateModifications: (id: string, modifications: string[]) => void;
  updateItemNotes: (id: string, notes: string) => void;
  setTable: (tableId: string | null) => void;
  setOrderType: (orderType: OrderType) => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number, type: 'percentage' | 'fixed') => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
}

let nextCartItemId = 1;

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  tableId: null,
  orderType: 'dine_in',
  notes: '',
  discount: 0,
  discountType: 'percentage',

  addItem: (menuItem: MenuItem) => {
    const { items } = get();
    const existingItem = items.find(
      (item) => item.menuItem.id === menuItem.id && item.modifications.length === 0
    );

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      const id = `cart-${nextCartItemId++}`;
      set({
        items: [...items, { id, menuItem, quantity: 1, modifications: [], notes: '' }],
      });
    }
  },

  removeItem: (id: string) => {
    set({ items: get().items.filter((item) => item.id !== id) });
  },

  updateQuantity: (id: string, quantity: number) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((item) => item.id !== id) });
      return;
    }
    set({
      items: get().items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    });
  },

  updateModifications: (id: string, modifications: string[]) => {
    set({
      items: get().items.map((item) =>
        item.id === id ? { ...item, modifications } : item
      ),
    });
  },

  updateItemNotes: (id: string, notes: string) => {
    set({
      items: get().items.map((item) =>
        item.id === id ? { ...item, notes } : item
      ),
    });
  },

  setTable: (tableId: string | null) => set({ tableId }),
  setOrderType: (orderType: OrderType) => set({ orderType }),
  setNotes: (notes: string) => set({ notes }),

  setDiscount: (discount: number, type: 'percentage' | 'fixed') => {
    set({ discount, discountType: type });
  },

  clearCart: () => {
    set({
      items: [],
      tableId: null,
      orderType: 'dine_in',
      notes: '',
      discount: 0,
      discountType: 'percentage',
    });
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return (subtotal - discountAmount) * 0.1;
  },

  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();
    if (discountType === 'percentage') {
      return subtotal * (discount / 100);
    }
    return Math.min(discount, subtotal);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax();
    const discountAmount = get().getDiscountAmount();
    return subtotal - discountAmount + tax;
  },
}));
