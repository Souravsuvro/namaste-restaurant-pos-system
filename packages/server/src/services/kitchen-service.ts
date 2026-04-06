import db from '../config/database';
import { IOrderWithItems, IOrderItemWithDetails, OrderItemStatus } from '../models/Order';
import { NotFoundError } from '../middleware/error';

interface KitchenQueueItem {
  order_id: string;
  order_number: number;
  order_type: string;
  table_number: number | null;
  created_at: string;
  items: IOrderItemWithDetails[];
}

export class KitchenService {
  getKitchenQueue(): { pending: KitchenQueueItem[]; preparing: KitchenQueueItem[]; ready: KitchenQueueItem[] } {
    const activeOrders = db.prepare(`
      SELECT o.id, o.order_number, o.order_type, o.created_at, o.status,
             t.number as table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.status IN ('pending', 'preparing', 'ready')
      ORDER BY o.created_at ASC
    `).all() as { id: string; order_number: number; order_type: string; created_at: string; status: string; table_number: number | null }[];

    const result: { pending: KitchenQueueItem[]; preparing: KitchenQueueItem[]; ready: KitchenQueueItem[] } = {
      pending: [],
      preparing: [],
      ready: [],
    };

    for (const order of activeOrders) {
      const items = db.prepare(`
        SELECT oi.*, mi.name as menu_item_name, mi.price as menu_item_price
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ? AND oi.status != 'cancelled'
        ORDER BY oi.created_at ASC
      `).all(order.id) as IOrderItemWithDetails[];

      const queueItem: KitchenQueueItem = {
        order_id: order.id,
        order_number: order.order_number,
        order_type: order.order_type,
        table_number: order.table_number,
        created_at: order.created_at,
        items,
      };

      if (order.status === 'pending') {
        result.pending.push(queueItem);
      } else if (order.status === 'preparing') {
        result.preparing.push(queueItem);
      } else if (order.status === 'ready') {
        result.ready.push(queueItem);
      }
    }

    return result;
  }

  updateItemStatus(itemId: string, status: OrderItemStatus): IOrderItemWithDetails {
    const item = db.prepare(`
      SELECT oi.*, mi.name as menu_item_name, mi.price as menu_item_price
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.id = ?
    `).get(itemId) as IOrderItemWithDetails | undefined;

    if (!item) {
      throw new NotFoundError('Order item');
    }

    db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run(status, itemId);

    // Check if all items in the order have been updated
    this.checkAndUpdateOrderStatus(item.order_id);

    return { ...item, status };
  }

  bumpOrder(orderId: string): IOrderWithItems {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as { id: string; status: string } | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    const statusMap: Record<string, string> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
    };

    const nextStatus = statusMap[order.status];
    if (!nextStatus) {
      throw new NotFoundError('No next status available for this order');
    }

    db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextStatus, orderId);

    // Also update all pending/preparing items when bumping
    if (nextStatus === 'preparing') {
      db.prepare(`UPDATE order_items SET status = 'preparing' WHERE order_id = ? AND status = 'pending'`).run(orderId);
    } else if (nextStatus === 'ready') {
      db.prepare(`UPDATE order_items SET status = 'ready' WHERE order_id = ? AND status IN ('pending', 'preparing')`).run(orderId);
    } else if (nextStatus === 'served') {
      db.prepare(`UPDATE order_items SET status = 'served' WHERE order_id = ? AND status IN ('pending', 'preparing', 'ready')`).run(orderId);
    }

    const updatedOrder = db.prepare(`
      SELECT o.*, t.number as table_number, u.name as staff_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE o.id = ?
    `).get(orderId) as IOrderWithItems;

    const items = db.prepare(`
      SELECT oi.*, mi.name as menu_item_name, mi.price as menu_item_price
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `).all(orderId) as IOrderItemWithDetails[];

    return { ...updatedOrder, items };
  }

  private checkAndUpdateOrderStatus(orderId: string): void {
    const items = db.prepare(`
      SELECT status FROM order_items WHERE order_id = ? AND status != 'cancelled'
    `).all(orderId) as { status: string }[];

    if (items.length === 0) return;

    const allReady = items.every((i) => i.status === 'ready' || i.status === 'served');
    const allServed = items.every((i) => i.status === 'served');
    const anyPreparing = items.some((i) => i.status === 'preparing');

    if (allServed) {
      db.prepare(`UPDATE orders SET status = 'served', updated_at = datetime('now') WHERE id = ?`).run(orderId);
    } else if (allReady) {
      db.prepare(`UPDATE orders SET status = 'ready', updated_at = datetime('now') WHERE id = ?`).run(orderId);
    } else if (anyPreparing) {
      db.prepare(`UPDATE orders SET status = 'preparing', updated_at = datetime('now') WHERE id = ?`).run(orderId);
    }
  }
}

export const kitchenService = new KitchenService();
