import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../config/database';
import { ITable, ITableWithOrder } from '../models/Table';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { emitTableUpdate } from '../socket/handlers';
import { generateUUID } from '../utils/helpers';

const router = Router();

const updateTableStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'needs_cleaning']),
});

const updateTableSchema = z.object({
  capacity: z.number().int().positive().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
});

const mergeTablesSchema = z.object({
  table_ids: z.array(z.string().uuid()).min(2),
  primary_table_id: z.string().uuid(),
});

const splitTableSchema = z.object({
  table_id: z.string().uuid(),
});

// GET /api/tables — List all tables
router.get('/', (_req: Request, res: Response) => {
  try {
    const tables = db.prepare(`
      SELECT t.*,
             o.status as order_status,
             o.total as order_total,
             o.created_at as order_created_at
      FROM tables t
      LEFT JOIN orders o ON t.current_order_id = o.id
      ORDER BY t.number
    `).all() as ITableWithOrder[];

    res.json(tables);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tables/:id — Get table with current order details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const table = db.prepare(`
      SELECT t.*,
             o.status as order_status,
             o.total as order_total,
             o.created_at as order_created_at
      FROM tables t
      LEFT JOIN orders o ON t.current_order_id = o.id
      WHERE t.id = ?
    `).get(req.params.id) as ITableWithOrder | undefined;

    if (!table) {
      res.status(404).json({ error: 'Table not found.' });
      return;
    }

    // If there's a current order, include order items
    let orderDetails = null;
    if (table.current_order_id) {
      orderDetails = db.prepare(`
        SELECT o.*,
               json_group_array(
                 json_object(
                   'id', oi.id,
                   'menu_item_name', mi.name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'status', oi.status,
                   'notes', oi.notes
                 )
               ) as items_json
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.id = ?
        GROUP BY o.id
      `).get(table.current_order_id) as (Record<string, unknown> & { items_json: string }) | undefined;

      if (orderDetails) {
        try {
          const items = JSON.parse(orderDetails.items_json);
          // Filter out null entries (from LEFT JOIN when no items)
          orderDetails = {
            ...orderDetails,
            items: items.filter((i: Record<string, unknown>) => i.id !== null),
          };
          delete (orderDetails as Record<string, unknown>).items_json;
        } catch {
          // If JSON parsing fails, just return without items
        }
      }
    }

    res.json({ ...table, current_order: orderDetails });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tables/:id/status — Update table status
router.patch('/:id/status', authenticate, validate(updateTableStatusSchema), (req: Request, res: Response) => {
  try {
    const table = db.prepare('SELECT id FROM tables WHERE id = ?').get(req.params.id);
    if (!table) {
      res.status(404).json({ error: 'Table not found.' });
      return;
    }

    const { status } = req.body;

    // If setting to available, clear current order
    if (status === 'available') {
      db.prepare('UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?').run(status, req.params.id);
    } else {
      db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, req.params.id);
    }

    const updated = db.prepare(`
      SELECT t.*, o.status as order_status, o.total as order_total, o.created_at as order_created_at
      FROM tables t
      LEFT JOIN orders o ON t.current_order_id = o.id
      WHERE t.id = ?
    `).get(req.params.id) as ITableWithOrder;

    emitTableUpdate(updated);
    res.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tables/:id — Update table info
router.put('/:id', authenticate, authorize('admin', 'manager'), validate(updateTableSchema), (req: Request, res: Response) => {
  try {
    const table = db.prepare('SELECT id FROM tables WHERE id = ?').get(req.params.id);
    if (!table) {
      res.status(404).json({ error: 'Table not found.' });
      return;
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (req.body.capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(req.body.capacity);
    }
    if (req.body.position_x !== undefined) {
      updates.push('position_x = ?');
      params.push(req.body.position_x);
    }
    if (req.body.position_y !== undefined) {
      updates.push('position_y = ?');
      params.push(req.body.position_y);
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE tables SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id) as ITable;
    emitTableUpdate(updated);
    res.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tables/merge — Merge tables
router.post('/merge', authenticate, validate(mergeTablesSchema), (req: Request, res: Response) => {
  try {
    const { table_ids, primary_table_id } = req.body;

    // Verify all tables exist
    for (const tableId of table_ids) {
      const table = db.prepare('SELECT id FROM tables WHERE id = ?').get(tableId);
      if (!table) {
        res.status(404).json({ error: `Table ${tableId} not found.` });
        return;
      }
    }

    // Get the primary table's current order
    const primaryTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(primary_table_id) as ITable;

    const mergeTx = db.transaction(() => {
      // If there are orders on secondary tables, link them to the primary table
      const secondaryTableIds = table_ids.filter((id: string) => id !== primary_table_id);

      for (const tableId of secondaryTableIds) {
        const secondaryTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId) as ITable;

        if (secondaryTable.current_order_id) {
          // Move the order to the primary table or merge items
          db.prepare('UPDATE orders SET table_id = ? WHERE id = ?').run(
            primary_table_id, secondaryTable.current_order_id
          );
        }

        // Mark secondary tables as occupied and linked
        db.prepare('UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?').run(
          'occupied', tableId
        );
      }

      // Ensure primary table is occupied
      db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('occupied', primary_table_id);
    });

    mergeTx();

    const tables = db.prepare(`
      SELECT * FROM tables WHERE id IN (${table_ids.map(() => '?').join(',')})
      ORDER BY number
    `).all(...table_ids) as ITable[];

    for (const table of tables) {
      emitTableUpdate(table);
    }

    res.json({ message: 'Tables merged successfully.', tables });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tables/split — Split a merged table
router.post('/split', authenticate, validate(splitTableSchema), (req: Request, res: Response) => {
  try {
    const { table_id } = req.body;

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(table_id) as ITable | undefined;
    if (!table) {
      res.status(404).json({ error: 'Table not found.' });
      return;
    }

    // Simply reset the table status
    db.prepare('UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?').run(
      'available', table_id
    );

    const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(table_id) as ITable;
    emitTableUpdate(updated);

    res.json({ message: 'Table split successfully.', table: updated });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

export default router;
