import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { runMigration } from './migrations/001_initial';

function seed(): void {
  console.log('Running migration...');
  runMigration();

  console.log('Seeding database...');

  // Check if data already exists
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  const insertAll = db.transaction(() => {
    // ==================== USERS ====================
    const insertUser = db.prepare(
      'INSERT INTO users (id, name, pin, role) VALUES (?, ?, ?, ?)'
    );

    const users = [
      { name: 'Admin', pin: '1234', role: 'admin' },
      { name: 'Manager', pin: '5678', role: 'manager' },
      { name: 'Cashier', pin: '1111', role: 'cashier' },
      { name: 'Kitchen', pin: '2222', role: 'kitchen' },
    ];

    for (const user of users) {
      const hashedPin = bcrypt.hashSync(user.pin, 10);
      insertUser.run(uuidv4(), user.name, hashedPin, user.role);
    }
    console.log(`  Seeded ${users.length} users.`);

    // ==================== CATEGORIES ====================
    const insertCategory = db.prepare(
      'INSERT INTO categories (id, name, display_order, active) VALUES (?, ?, ?, 1)'
    );

    const categories: { id: string; name: string; order: number }[] = [
      { id: uuidv4(), name: 'Entr\u00e9es', order: 1 },
      { id: uuidv4(), name: 'Plats Principaux', order: 2 },
      { id: uuidv4(), name: 'Tandoori & Grillades', order: 3 },
      { id: uuidv4(), name: 'Biryani & Riz', order: 4 },
      { id: uuidv4(), name: 'Desserts', order: 5 },
      { id: uuidv4(), name: 'Bar & Cocktails', order: 6 },
    ];

    for (const cat of categories) {
      insertCategory.run(cat.id, cat.name, cat.order);
    }
    console.log(`  Seeded ${categories.length} categories.`);

    // Helper to find category ID by name
    const catId = (name: string): string => {
      const cat = categories.find((c) => c.name === name);
      if (!cat) throw new Error(`Category "${name}" not found`);
      return cat.id;
    };

    // ==================== MENU ITEMS ====================
    const insertMenuItem = db.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price, available, spice_level, is_vegetarian, is_vegan)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    const menuItems = [
      // Entr\u00e9es
      {
        category: 'Entr\u00e9es',
        name: 'Samosa de Canard Confit',
        description: 'Crispy pastry filled with slow-cooked duck confit, served with tamarind chutney',
        price: 9,
        spice: 0,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Entr\u00e9es',
        name: 'Pakora de L\u00e9gumes du Jardin',
        description: 'Seasonal garden vegetables in a crispy chickpea batter with mint raita',
        price: 7,
        spice: 0,
        vegetarian: 1,
        vegan: 1,
      },
      {
        category: 'Entr\u00e9es',
        name: 'Soupe Mulligatawny \u00e0 la Truffe',
        description: 'Classic Anglo-Indian soup elevated with black truffle and cream',
        price: 11,
        spice: 0,
        vegetarian: 0,
        vegan: 0,
      },
      // Plats Principaux
      {
        category: 'Plats Principaux',
        name: 'Butter Chicken du Chef',
        description: 'Tender chicken in a rich tomato-butter sauce with fenugreek and cream',
        price: 18,
        spice: 2,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Plats Principaux',
        name: 'Agneau Rogan Josh',
        description: 'Slow-braised lamb in a Kashmiri chili and aromatic spice gravy',
        price: 22,
        spice: 3,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Plats Principaux',
        name: 'Palak Paneer Fermier',
        description: 'Farm-fresh spinach and artisan paneer in a delicate spice blend',
        price: 16,
        spice: 1,
        vegetarian: 1,
        vegan: 0,
      },
      {
        category: 'Plats Principaux',
        name: 'Crevettes Malabar',
        description: 'Tiger prawns in a coconut and curry leaf sauce from the Malabar coast',
        price: 24,
        spice: 2,
        vegetarian: 0,
        vegan: 0,
      },
      // Tandoori & Grillades
      {
        category: 'Tandoori & Grillades',
        name: 'Tandoori Mixed Grill',
        description: 'Selection of chicken tikka, lamb chops, and seekh kebab from the tandoor',
        price: 28,
        spice: 2,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Tandoori & Grillades',
        name: 'Paneer Tikka',
        description: 'Marinated artisan paneer grilled in the tandoor with peppers and onions',
        price: 14,
        spice: 2,
        vegetarian: 1,
        vegan: 0,
      },
      // Biryani & Riz
      {
        category: 'Biryani & Riz',
        name: 'Biryani Royal \u00e0 l\'Agneau',
        description: 'Fragrant basmati rice layered with spiced lamb, saffron, and caramelized onions',
        price: 20,
        spice: 2,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Biryani & Riz',
        name: 'Biryani V\u00e9g\u00e9tarien',
        description: 'Seasonal vegetables and paneer layered with aromatic basmati rice',
        price: 16,
        spice: 1,
        vegetarian: 1,
        vegan: 0,
      },
      // Desserts
      {
        category: 'Desserts',
        name: 'Gulab Jamun au Cognac',
        description: 'Traditional milk dumplings soaked in rose-cardamom syrup with a touch of Cognac',
        price: 9,
        spice: 0,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Desserts',
        name: 'Kulfi \u00e0 la Lavande',
        description: 'Indian ice cream infused with Proven\u00e7al lavender and pistachios',
        price: 8,
        spice: 0,
        vegetarian: 1,
        vegan: 0,
      },
      {
        category: 'Desserts',
        name: 'Cr\u00e8me Br\u00fbl\u00e9e au Cardamome',
        description: 'Classic French cr\u00e8me br\u00fbl\u00e9e with green cardamom and saffron',
        price: 10,
        spice: 0,
        vegetarian: 1,
        vegan: 0,
      },
      // Bar & Cocktails
      {
        category: 'Bar & Cocktails',
        name: 'Mango Lassi Royale',
        description: 'Premium Alphonso mango yogurt drink with saffron',
        price: 12,
        spice: 0,
        vegetarian: 1,
        vegan: 1,
      },
      {
        category: 'Bar & Cocktails',
        name: 'Loire Sunset',
        description: 'Local Loire Valley ros\u00e9 with mango and cardamom syrup',
        price: 14,
        spice: 0,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Bar & Cocktails',
        name: 'Masala Old Fashioned',
        description: 'Bourbon infused with garam masala, orange peel, and jaggery',
        price: 15,
        spice: 0,
        vegetarian: 0,
        vegan: 0,
      },
      {
        category: 'Bar & Cocktails',
        name: 'Chai Espresso Martini',
        description: 'Vodka, espresso, and house-made chai syrup with star anise',
        price: 14,
        spice: 0,
        vegetarian: 0,
        vegan: 0,
      },
    ];

    for (const item of menuItems) {
      insertMenuItem.run(
        uuidv4(),
        catId(item.category),
        item.name,
        item.description,
        item.price,
        item.spice,
        item.vegetarian,
        item.vegan
      );
    }
    console.log(`  Seeded ${menuItems.length} menu items.`);

    // ==================== TABLES ====================
    const insertTable = db.prepare(
      'INSERT INTO tables (id, number, capacity, status, position_x, position_y) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (let i = 1; i <= 12; i++) {
      let capacity: number;
      if (i <= 4) capacity = 2;
      else if (i <= 8) capacity = 4;
      else if (i <= 10) capacity = 6;
      else capacity = 8;

      // Arrange in a 4x3 grid
      const col = ((i - 1) % 4);
      const row = Math.floor((i - 1) / 4);
      const posX = col * 150 + 50;
      const posY = row * 150 + 50;

      insertTable.run(uuidv4(), i, capacity, 'available', posX, posY);
    }
    console.log('  Seeded 12 tables.');
  });

  insertAll();
  console.log('Database seeded successfully!');
}

// Run when executed directly
seed();
