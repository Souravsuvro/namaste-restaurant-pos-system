import db from '../config/database';
import { config } from '../config/env';
import { generateUUID, calculateTax, roundCurrency, getTodayDateString } from '../utils/helpers';
import { IOrder, IOrderItem, IOrderWithItems, IOrderItemWithDetails, OrderStatus } from '../models/Order';
import { NotFoundError, ValidationError } from '../middleware/error';

interface CreateOrderInput {
  table_id?: string | null;
  order_type?: string;
  notes?: string;
  customer_name?: string;
  staff_id?: string;
  items: {
    menu_item_id: string;
    quantity: number;
    modifications?: string;
    notes?: string;
  }[];
}

interface UpdateOrderInput {
  notes?: string;
  customer_name?: string;
  discount_amount?: number;
}

export class OrderService {
  getNextOrderNumber(): number {
    const today = getTodayDateString();
    const result = db.prepare(`
      SELECT MAX(order_number) as max_num
      FROM orders
      WHERE date(created_at) = date(?)
    `).get(today) as { max_num: number | null };

    return (result?.max_num ?? 0) + 1;
  }

  calculateOrderTotals(orderId: string): { subtotal: number; tax_amount: number; total: number; discount_amount: number } {
    const items = db.prepare(`
      SELECT quantity, unit_price FROM order_items
      WHERE order_id = ? AND status != 'cancelled'
    `).all(orderId) as { quantity: number; unit_price: number }[];

    const subtotal = roundCurrency(
      items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    );

    const order = db.prepare('SELECT discount_amount FROM orders WHERE id = ?').get(orderId) as { discount_amount: number } | undefined;
    const discountAmount = order?.discount_amount ?? 0;

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = calculateTax(Math.max(0, taxableAmount));
    const total = roundCurrency(Math.max(0, taxableAmount) + taxAmount);

    return { subtotal, tax_amount: taxAmount, total, discount_amount: discountAmount };
  }

  createOrder(input: CreateOrderInput): IOrderWithItems {
    const orderId = generateUUID();
    const orderNumber = this.getNextOrderNumber();

    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Order must have at least one item.');
    }

    // Validate all menu items exist and are available
    const menuItemStmt = db.prepare('SELECT id, price, name, available FROM menu_items WHERE id = ?');
    const validatedItems: { menu_item_id: string; quantity: number; unit_price: number; modifications?: string; notes?: string; name: string }[] = [];

    for (const item of input.items) {
      const menuItem = menuItemStmt.get(item.menu_item_id) as { id: string; price: number; name: string; available: number } | undefined;
      if (!menuItem) {
        throw new NotFoundError(`Menu item ${item.menu_item_id}`);
      }
      if (!menuItem.available) {
        throw new ValidationError(`Menu item "${menuItem.name}" is not available.`);
      }
      validatedItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: menuItem.price,
        modifications: item.modifications,
        notes: item.notes,
        name: menuItem.name,
      });
    }

    // If dine-in, validate table exists and is not occupied by another active order
    if (input.table_id) {
      const table = db.prepare('SELECT id, status, current_order_id FROM tables WHERE id = ?').get(input.table_id) as { id: string; status: string; current_order_id: string | null } | undefined;
      if (!table) {
        throw new NotFoundError('Table');
      }
    }

    const createOrderTx = db.transaction(() => {
      // Insert order
      db.prepare(`
        INSERT INTO orders (id, order_number, table_id, order_type, status, notes, customer_name, staff_id)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
      `).run(
        orderId,
        orderNumber,
        input.table_id ?? null,
        input.order_type ?? 'dine_in',
        input.notes ?? null,
        input.customer_name ?? null,
        input.staff_id ?? null
      );

      // Insert order items
      const insertItem = db.prepare(`
        INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, modifications, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedItems) {
        insertItem.run(
          generateUUID(),
          orderId,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.modifications ?? null,
          item.notes ?? null
        );
      }

      // Calculate and update totals
      const totals = this.calculateOrderTotals(orderId);
      db.prepare(`
        UPDATE orders SET subtotal = ?, tax_amount = ?, total = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(totals.subtotal, totals.tax_amount, totals.total, orderId);

      // Update table status if dine-in
      if (input.table_id && (input.order_type ?? 'dine_in') === 'dine_in') {
        db.prepare(`
          UPDATE tables SET status = 'occupied', current_order_id = ? WHERE id = ?
        `).run(orderId, input.table_id);
      }
    });

    createOrderTx();

    return this.getOrderById(orderId)!;
  }

  getOrderById(orderId: string): IOrderWithItems | null {
    const order = db.prepare(`
      SELECT o.*, t.number as table_number, u.name as staff_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE o.id = ?
    `).get(orderId) as (IOrder & { table_number?: number; staff_name?: string }) | undefined;

    if (!order) return null;

    const items = db.prepare(`
      SELECT oi.*, mi.name as menu_item_name, mi.price as menu_item_price
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `).all(orderId) as IOrderItemWithDetails[];

    return {
      ...order,
      items,
    };
  }

  getOrders(filters: {
    status?: string;
    order_type?: string;
    table_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): { orders: IOrderWithItems[]; total: number } {
    let whereClause = '1=1';
    const params: unknown[] = [];

    if (filters.status) {
      whereClause += ' AND o.status = ?';
      params.push(filters.status);
    }
    if (filters.order_type) {
      whereClause += ' AND o.order_type = ?';
      params.push(filters.order_type);
    }
    if (filters.table_id) {
      whereClause += ' AND o.table_id = ?';
      params.push(filters.table_id);
    }
    if (filters.date_from) {
      whereClause += ' AND o.created_at >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      whereClause += ' AND o.created_at <= ?';
      params.push(filters.date_to);
    }

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}
    `).get(...params) as { total: number };

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const orders = db.prepare(`
      SELECT o.*, t.number as table_number, u.name as staff_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as (IOrder & { table_number?: number; staff_name?: string })[];

    const ordersWithItems: IOrderWithItems[] = orders.map((order) => {
      const items = db.prepare(`
        SELECT oi.*, mi.name as menu_item_name, mi.price as menu_item_price
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
        ORDER BY oi.created_at
      `).all(order.id) as IOrderItemWithDetails[];

      return { ...order, items };
    });

    return { orders: ordersWithItems, total: countResult.total };
  }

  updateOrder(orderId: string, input: UpdateOrderInput): IOrderWithItems {
    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
    if (!existing) {
      throw new NotFoundError('Order');
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.notes !== undefined) {
      updates.push('notes = ?');
      params.push(input.notes);
    }
    if (input.customer_name !== undefined) {
      updates.push('customer_name = ?');
      params.push(input.customer_name);
    }
    if (input.discount_amount !== undefined) {
      updates.push('discount_amount = ?');
      params.push(input.discount_amount);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(orderId);

      db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      // Recalculate totals if discount changed
      if (input.discount_amount !== undefined) {
        const totals = this.calculateOrderTotals(orderId);
        db.prepare(`
          UPDATE orders SET subtotal = ?, tax_amount = ?, total = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(totals.subtotal, totals.tax_amount, totals.total, orderId);
      }
    }

    return this.getOrderById(orderId)!;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): IOrderWithItems {
    const order = db.prepare('SELECT id, table_id, status FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    db.prepare(`
      UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, orderId);

    // Free table when order is completed or cancelled
    if ((status === 'completed' || status === 'cancelled') && order.table_id) {
      db.prepare(`
        UPDATE tables SET status = 'needs_cleaning', current_order_id = NULL WHERE id = ?
      `).run(order.table_id);
    }

    return this.getOrderById(orderId)!;
  }

  addItemsToOrder(orderId: string, items: { menu_item_id: string; quantity: number; modifications?: string; notes?: string }[]): IOrderWithItems {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
      throw new ValidationError(`Cannot add items to a ${order.status} order.`);
    }

    const menuItemStmt = db.prepare('SELECT id, price, name, available FROM menu_items WHERE id = ?');

    const addItemsTx = db.transaction(() => {
      const insertItem = db.prepare(`
        INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, modifications, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const menuItem = menuItemStmt.get(item.menu_item_id) as { id: string; price: number; name: string; available: number } | undefined;
        if (!menuItem) {
          throw new NotFoundError(`Menu item ${item.menu_item_id}`);
        }
        if (!menuItem.available) {
          throw new ValidationError(`Menu item "${menuItem.name}" is not available.`);
        }

        insertItem.run(
          generateUUID(),
          orderId,
          item.menu_item_id,
          item.quantity,
          menuItem.price,
          item.modifications ?? null,
          item.notes ?? null
        );
      }

      // Recalculate totals
      const totals = this.calculateOrderTotals(orderId);
      db.prepare(`
        UPDATE orders SET subtotal = ?, tax_amount = ?, total = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(totals.subtotal, totals.tax_amount, totals.total, orderId);
    });

    addItemsTx();

    return this.getOrderById(orderId)!;
  }

  removeItemFromOrder(orderId: string, itemId: string): IOrderWithItems {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
      throw new ValidationError(`Cannot remove items from a ${order.status} order.`);
    }

    const item = db.prepare('SELECT id FROM order_items WHERE id = ? AND order_id = ?').get(itemId, orderId);
    if (!item) {
      throw new NotFoundError('Order item');
    }

    const removeItemTx = db.transaction(() => {
      db.prepare('DELETE FROM order_items WHERE id = ? AND order_id = ?').run(itemId, orderId);

      // Recalculate totals
      const totals = this.calculateOrderTotals(orderId);
      db.prepare(`
        UPDATE orders SET subtotal = ?, tax_amount = ?, total = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(totals.subtotal, totals.tax_amount, totals.total, orderId);
    });

    removeItemTx();

    return this.getOrderById(orderId)!;
  }

  updateItemStatus(orderId: string, itemId: string, status: string): IOrderItem {
    const item = db.prepare('SELECT id FROM order_items WHERE id = ? AND order_id = ?').get(itemId, orderId) as IOrderItem | undefined;
    if (!item) {
      throw new NotFoundError('Order item');
    }

    db.prepare(`
      UPDATE order_items SET status = ? WHERE id = ?
    `).run(status, itemId);

    return db.prepare(`
      SELECT oi.*, mi.name as menu_item_name, mi.price as menu_item_price
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.id = ?
    `).get(itemId) as IOrderItem;
  }

  holdOrder(orderId: string): IOrderWithItems {
    const order = db.prepare('SELECT id, table_id FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    db.prepare(`
      UPDATE orders SET status = 'pending', notes = COALESCE(notes || ' [ON HOLD]', '[ON HOLD]'), updated_at = datetime('now')
      WHERE id = ?
    `).run(orderId);

    // Free the table temporarily
    if (order.table_id) {
      db.prepare(`
        UPDATE tables SET status = 'reserved', current_order_id = NULL WHERE id = ?
      `).run(order.table_id);
    }

    return this.getOrderById(orderId)!;
  }
}

export const orderService = new OrderService();
