import db from '../../config/database';

export function runMigration(): void {
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

    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `);

  console.log('Migration 001_initial completed successfully.');
}

// Run when executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].includes('001_initial') ||
  process.argv[1].includes('migrate')
);

if (isDirectRun) {
  runMigration();
  console.log('Migration finished.');
  process.exit(0);
}
