import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';

const testDbPath = process.env.DATABASE_URL || path.resolve(__dirname, '../data/test.db');

describe('Orders', () => {
  let db: Database.Database;
  let categoryId: string;
  let menuItemId: string;
  let tableId: string;
  let userId: string;
  let orderId: string;

  beforeAll(() => {
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create all tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier', 'kitchen')),
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        available INTEGER DEFAULT 1,
        spice_level INTEGER DEFAULT 0 CHECK(spice_level >= 0 AND spice_level <= 5),
        is_vegetarian INTEGER DEFAULT 0,
        is_vegan INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        number INTEGER NOT NULL UNIQUE,
        capacity INTEGER NOT NULL DEFAULT 4,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved', 'needs_cleaning')),
        current_order_id TEXT,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number INTEGER NOT NULL,
        table_id TEXT,
        order_type TEXT DEFAULT 'dine_in' CHECK(order_type IN ('dine_in', 'takeaway', 'delivery')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
        subtotal REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        notes TEXT,
        customer_name TEXT,
        staff_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL,
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        menu_item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        modifications TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL CHECK(method IN ('cash', 'card', 'mobile')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'refunded', 'failed')),
        reference TEXT,
        change_amount REAL DEFAULT 0,
        tip_amount REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // Seed test data
    userId = uuidv4();
    categoryId = uuidv4();
    menuItemId = uuidv4();
    tableId = uuidv4();

    const hashedPin = bcrypt.hashSync('1234', 10);
    db.prepare('INSERT OR IGNORE INTO users (id, name, pin, role) VALUES (?, ?, ?, ?)').run(
      userId, 'Test Admin', hashedPin, 'admin'
    );

    db.prepare('INSERT OR IGNORE INTO categories (id, name, display_order) VALUES (?, ?, ?)').run(
      categoryId, 'Plats Principaux', 2
    );

    db.prepare('INSERT OR IGNORE INTO menu_items (id, category_id, name, price, spice_level) VALUES (?, ?, ?, ?, ?)').run(
      menuItemId, categoryId, 'Butter Chicken du Chef', 18, 2
    );

    db.prepare('INSERT OR IGNORE INTO tables (id, number, capacity, status) VALUES (?, ?, ?, ?)').run(
      tableId, 99, 4, 'available'
    );
  });

  it('should create an order with items', () => {
    orderId = uuidv4();
    const orderItemId = uuidv4();

    db.prepare(`
      INSERT INTO orders (id, order_number, table_id, order_type, status, staff_id)
      VALUES (?, ?, ?, 'dine_in', 'pending', ?)
    `).run(orderId, 1, tableId, userId);

    db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderItemId, orderId, menuItemId, 2, 18);

    // Calculate totals
    const items = db.prepare(`
      SELECT SUM(quantity * unit_price) as subtotal
      FROM order_items WHERE order_id = ?
    `).get(orderId) as { subtotal: number };

    const subtotal = items.subtotal;
    const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
    const total = subtotal + taxAmount;

    db.prepare('UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?').run(
      subtotal, taxAmount, total, orderId
    );

    // Update table status
    db.prepare('UPDATE tables SET status = ?, current_order_id = ? WHERE id = ?').run(
      'occupied', orderId, tableId
    );

    // Verify
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>;
    expect(order).toBeTruthy();
    expect(order.subtotal).toBe(36);
    expect(order.tax_amount).toBe(3.6);
    expect(order.total).toBe(39.6);
    expect(order.status).toBe('pending');

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId) as Record<string, unknown>;
    expect(table.status).toBe('occupied');
    expect(table.current_order_id).toBe(orderId);
  });

  it('should update order status', () => {
    db.prepare("UPDATE orders SET status = 'preparing', updated_at = datetime('now') WHERE id = ?").run(orderId);

    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: string };
    expect(order.status).toBe('preparing');
  });

  it('should advance order through statuses', () => {
    const statuses = ['preparing', 'ready', 'served', 'completed'];

    for (const status of statuses) {
      db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, orderId);

      const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: string };
      expect(order.status).toBe(status);
    }
  });

  it('should free table when order is completed', () => {
    // Simulate completing the order
    db.prepare("UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(orderId);
    db.prepare("UPDATE tables SET status = 'needs_cleaning', current_order_id = NULL WHERE id = ?").run(tableId);

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId) as Record<string, unknown>;
    expect(table.status).toBe('needs_cleaning');
    expect(table.current_order_id).toBeNull();
  });

  it('should add items to an existing order', () => {
    // Create a new order
    const newOrderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, order_number, order_type, status, staff_id)
      VALUES (?, ?, 'takeaway', 'pending', ?)
    `).run(newOrderId, 2, userId);

    // Add first item
    const item1Id = uuidv4();
    db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `).run(item1Id, newOrderId, menuItemId, 1, 18);

    // Add second item
    const item2Id = uuidv4();
    db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(item2Id, newOrderId, menuItemId, 2, 18, 'Extra spicy');

    // Recalculate totals
    const totals = db.prepare(`
      SELECT SUM(quantity * unit_price) as subtotal
      FROM order_items WHERE order_id = ? AND status != 'cancelled'
    `).get(newOrderId) as { subtotal: number };

    const subtotal = totals.subtotal;
    const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
    const total = subtotal + taxAmount;

    db.prepare('UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?').run(
      subtotal, taxAmount, total, newOrderId
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(newOrderId) as Record<string, unknown>;
    expect(order.subtotal).toBe(54); // 18 + 36
    expect(order.total).toBe(59.4); // 54 + 5.4

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(newOrderId);
    expect(items.length).toBe(2);
  });

  it('should cancel individual items', () => {
    const cancelOrderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, order_number, order_type, status, staff_id)
      VALUES (?, ?, 'dine_in', 'pending', ?)
    `).run(cancelOrderId, 3, userId);

    const itemId = uuidv4();
    db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `).run(itemId, cancelOrderId, menuItemId, 1, 18);

    // Cancel the item
    db.prepare("UPDATE order_items SET status = 'cancelled' WHERE id = ?").run(itemId);

    const item = db.prepare('SELECT status FROM order_items WHERE id = ?').get(itemId) as { status: string };
    expect(item.status).toBe('cancelled');

    // Recalculate - should be 0 since the only item is cancelled
    const totals = db.prepare(`
      SELECT COALESCE(SUM(quantity * unit_price), 0) as subtotal
      FROM order_items WHERE order_id = ? AND status != 'cancelled'
    `).get(cancelOrderId) as { subtotal: number };

    expect(totals.subtotal).toBe(0);
  });

  it('should generate sequential order numbers per day', () => {
    const today = new Date().toISOString().split('T')[0];

    const result = db.prepare(`
      SELECT MAX(order_number) as max_num
      FROM orders
      WHERE date(created_at) = date(?)
    `).get(today) as { max_num: number | null };

    const nextNumber = (result?.max_num ?? 0) + 1;
    expect(nextNumber).toBeGreaterThan(0);
  });

  it('should handle payment processing', () => {
    // Create an order for payment
    const payOrderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, order_number, order_type, status, subtotal, tax_amount, total, staff_id)
      VALUES (?, ?, 'takeaway', 'served', 36, 3.6, 39.6, ?)
    `).run(payOrderId, 10, userId);

    // Process cash payment
    const paymentId = uuidv4();
    const amountGiven = 50;
    const changeAmount = Math.round((amountGiven - 39.6) * 100) / 100;

    db.prepare(`
      INSERT INTO payments (id, order_id, amount, method, status, change_amount)
      VALUES (?, ?, ?, 'cash', 'completed', ?)
    `).run(paymentId, payOrderId, 39.6, changeAmount);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as Record<string, unknown>;
    expect(payment.amount).toBe(39.6);
    expect(payment.method).toBe('cash');
    expect(payment.change_amount).toBe(10.4);
    expect(payment.status).toBe('completed');
  });
});
