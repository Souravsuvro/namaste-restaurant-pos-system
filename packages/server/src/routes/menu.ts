import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../config/database';
import { generateUUID } from '../utils/helpers';
import { IMenuItemWithCategory, ICategory } from '../models/MenuItem';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const createMenuItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  image_url: z.string().url().optional().nullable(),
  available: z.number().int().min(0).max(1).optional(),
  spice_level: z.number().int().min(0).max(5).optional(),
  is_vegetarian: z.number().int().min(0).max(1).optional(),
  is_vegan: z.number().int().min(0).max(1).optional(),
});

const updateMenuItemSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  image_url: z.string().url().optional().nullable(),
  available: z.number().int().min(0).max(1).optional(),
  spice_level: z.number().int().min(0).max(5).optional(),
  is_vegetarian: z.number().int().min(0).max(1).optional(),
  is_vegan: z.number().int().min(0).max(1).optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  display_order: z.number().int().min(0).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  display_order: z.number().int().min(0).optional(),
  active: z.number().int().min(0).max(1).optional(),
});

// GET /api/menu — List all menu items
router.get('/', (req: Request, res: Response) => {
  let whereClause = '1=1';
  const params: unknown[] = [];

  if (req.query.category_id) {
    whereClause += ' AND mi.category_id = ?';
    params.push(req.query.category_id);
  }

  if (req.query.available !== undefined) {
    whereClause += ' AND mi.available = ?';
    params.push(Number(req.query.available));
  }

  if (req.query.search) {
    whereClause += ' AND (mi.name LIKE ? OR mi.description LIKE ?)';
    const searchTerm = `%${req.query.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (req.query.vegetarian) {
    whereClause += ' AND mi.is_vegetarian = 1';
  }

  if (req.query.vegan) {
    whereClause += ' AND mi.is_vegan = 1';
  }

  const items = db.prepare(`
    SELECT mi.*, c.name as category_name, c.display_order as category_display_order
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE ${whereClause}
    ORDER BY c.display_order, mi.name
  `).all(...params) as IMenuItemWithCategory[];

  res.json(items);
});

// GET /api/menu/categories — List all categories
router.get('/categories', (_req: Request, res: Response) => {
  const categories = db.prepare(
    'SELECT * FROM categories WHERE active = 1 ORDER BY display_order'
  ).all() as ICategory[];

  res.json(categories);
});

// GET /api/menu/:id — Get single menu item
router.get('/:id', (req: Request, res: Response) => {
  const item = db.prepare(`
    SELECT mi.*, c.name as category_name, c.display_order as category_display_order
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE mi.id = ?
  `).get(req.params.id) as IMenuItemWithCategory | undefined;

  if (!item) {
    res.status(404).json({ error: 'Menu item not found.' });
    return;
  }

  res.json(item);
});

// POST /api/menu — Create menu item (admin/manager)
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validate(createMenuItemSchema),
  (req: Request, res: Response) => {
    const id = generateUUID();
    const {
      category_id, name, description, price, image_url,
      available, spice_level, is_vegetarian, is_vegan,
    } = req.body;

    // Verify category exists
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    db.prepare(`
      INSERT INTO menu_items (id, category_id, name, description, price, image_url, available, spice_level, is_vegetarian, is_vegan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, category_id, name,
      description ?? null,
      price,
      image_url ?? null,
      available ?? 1,
      spice_level ?? 0,
      is_vegetarian ?? 0,
      is_vegan ?? 0
    );

    const item = db.prepare(`
      SELECT mi.*, c.name as category_name, c.display_order as category_display_order
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ?
    `).get(id) as IMenuItemWithCategory;

    res.status(201).json(item);
  }
);

// PUT /api/menu/:id — Update menu item (admin/manager)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  validate(updateMenuItemSchema),
  (req: Request, res: Response) => {
    const existing = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }

    const fields = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      db.prepare(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const item = db.prepare(`
      SELECT mi.*, c.name as category_name, c.display_order as category_display_order
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ?
    `).get(req.params.id) as IMenuItemWithCategory;

    res.json(item);
  }
);

// PATCH /api/menu/:id/availability — Toggle availability
router.patch('/:id/availability', (req: Request, res: Response) => {
  const item = db.prepare('SELECT id, available FROM menu_items WHERE id = ?').get(req.params.id) as { id: string; available: number } | undefined;
  if (!item) {
    res.status(404).json({ error: 'Menu item not found.' });
    return;
  }

  const newAvailability = item.available ? 0 : 1;
  db.prepare(`UPDATE menu_items SET available = ?, updated_at = datetime('now') WHERE id = ?`).run(newAvailability, req.params.id);

  const updated = db.prepare(`
    SELECT mi.*, c.name as category_name, c.display_order as category_display_order
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE mi.id = ?
  `).get(req.params.id) as IMenuItemWithCategory;

  res.json(updated);
});

// POST /api/menu/categories — Create category
router.post('/categories', authenticate, authorize('admin', 'manager'), validate(createCategorySchema), (req: Request, res: Response) => {
  const id = generateUUID();
  const { name, display_order } = req.body;

  db.prepare('INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)').run(
    id, name, display_order ?? 0
  );

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as ICategory;
  res.status(201).json(category);
});

// PUT /api/menu/categories/:id — Update category
router.put('/categories/:id', authenticate, authorize('admin', 'manager'), validate(updateCategorySchema), (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const fields = req.body;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as ICategory;
  res.json(category);
});

export default router;
