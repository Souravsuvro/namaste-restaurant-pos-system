import { create } from 'zustand';
import type { Order } from '@/types/order';

interface OrderStore {
  activeOrders: Order[];
  kitchenQueue: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  setKitchenQueue: (orders: Order[]) => void;
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  activeOrders: [],
  kitchenQueue: [],

  setOrders: (orders: Order[]) => {
    set({ activeOrders: orders });
    const kitchen = orders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
    );
    set({ kitchenQueue: kitchen });
  },

  addOrder: (order: Order) => {
    const { activeOrders } = get();
    const exists = activeOrders.find((o) => o.id === order.id);
    if (exists) {
      set({
        activeOrders: activeOrders.map((o) => (o.id === order.id ? order : o)),
      });
    } else {
      set({ activeOrders: [...activeOrders, order] });
    }
    if (
      order.status === 'pending' ||
      order.status === 'preparing' ||
      order.status === 'ready'
    ) {
      const { kitchenQueue } = get();
      const kitchenExists = kitchenQueue.find((o) => o.id === order.id);
      if (kitchenExists) {
        set({
          kitchenQueue: kitchenQueue.map((o) => (o.id === order.id ? order : o)),
        });
      } else {
        set({ kitchenQueue: [...kitchenQueue, order] });
      }
    }
  },

  updateOrder: (order: Order) => {
    set({
      activeOrders: get().activeOrders.map((o) => (o.id === order.id ? order : o)),
    });
    if (
      order.status === 'pending' ||
      order.status === 'preparing' ||
      order.status === 'ready'
    ) {
      const { kitchenQueue } = get();
      const exists = kitchenQueue.find((o) => o.id === order.id);
      if (exists) {
        set({
          kitchenQueue: kitchenQueue.map((o) => (o.id === order.id ? order : o)),
        });
      } else {
        set({ kitchenQueue: [...kitchenQueue, order] });
      }
    } else {
      set({
        kitchenQueue: get().kitchenQueue.filter((o) => o.id !== order.id),
      });
    }
  },

  removeOrder: (orderId: string) => {
    set({
      activeOrders: get().activeOrders.filter((o) => o.id !== orderId),
      kitchenQueue: get().kitchenQueue.filter((o) => o.id !== orderId),
    });
  },

  setKitchenQueue: (orders: Order[]) => set({ kitchenQueue: orders }),
}));
