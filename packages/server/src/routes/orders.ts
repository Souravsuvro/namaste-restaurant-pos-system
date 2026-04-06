import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order-service';
import { kitchenService } from '../services/kitchen-service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { emitOrderNew, emitOrderUpdate, emitOrderReady, emitOrderItemUpdate } from '../socket/handlers';

const router = Router();

const createOrderSchema = z.object({
  table_id: z.string().uuid().optional().nullable(),
  order_type: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
  notes: z.string().optional(),
  customer_name: z.string().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    modifications: z.string().optional(),
    notes: z.string().optional(),
  })).min(1),
});

const updateOrderSchema = z.object({
  notes: z.string().optional(),
  customer_name: z.string().optional(),
  discount_amount: z.number().min(0).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled']),
});

const addItemsSchema = z.object({
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    modifications: z.string().optional(),
    notes: z.string().optional(),
  })).min(1),
});

const updateItemStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'served', 'cancelled']),
});

// GET /api/orders — List orders with filters
router.get('/', (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      order_type: req.query.order_type as string | undefined,
      table_id: req.query.table_id as string | undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = orderService.getOrders(filters);
    res.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/kitchen — Kitchen queue
router.get('/kitchen', (_req: Request, res: Response) => {
  try {
    const queue = kitchenService.getKitchenQueue();
    res.json(queue);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — Get single order
router.get('/:id', (req: Request, res: Response) => {
  try {
    const order = orderService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json(order);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — Create new order
router.post('/', authenticate, validate(createOrderSchema), (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = orderService.createOrder({
      ...req.body,
      staff_id: req.user!.userId,
    });

    emitOrderNew(order);
    res.status(201).json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// PUT /api/orders/:id — Update order
router.put('/:id', authenticate, validate(updateOrderSchema), (req: Request, res: Response) => {
  try {
    const order = orderService.updateOrder(req.params.id, req.body);
    emitOrderUpdate(order);
    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', authenticate, validate(updateStatusSchema), (req: Request, res: Response) => {
  try {
    const order = orderService.updateOrderStatus(req.params.id, req.body.status);

    if (req.body.status === 'ready') {
      emitOrderReady(order);
    }
    emitOrderUpdate(order);

    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/orders/:id/items — Add items to existing order
router.post('/:id/items', authenticate, validate(addItemsSchema), (req: Request, res: Response) => {
  try {
    const order = orderService.addItemsToOrder(req.params.id, req.body.items);
    emitOrderUpdate(order);
    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id/items/:itemId — Remove item from order
router.delete('/:id/items/:itemId', authenticate, (req: Request, res: Response) => {
  try {
    const order = orderService.removeItemFromOrder(req.params.id, req.params.itemId);
    emitOrderUpdate(order);
    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/items/:itemId/status — Update item status (kitchen)
router.patch('/:id/items/:itemId/status', authenticate, validate(updateItemStatusSchema), (req: Request, res: Response) => {
  try {
    const item = orderService.updateItemStatus(req.params.id, req.params.itemId, req.body.status);
    emitOrderItemUpdate(item);

    // Check if all items are ready to emit order:ready
    const order = orderService.getOrderById(req.params.id);
    if (order && order.status === 'ready') {
      emitOrderReady(order);
    }
    if (order) {
      emitOrderUpdate(order);
    }

    res.json(item);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/orders/:id/hold — Park/hold an order
router.post('/:id/hold', authenticate, (req: Request, res: Response) => {
  try {
    const order = orderService.holdOrder(req.params.id);
    emitOrderUpdate(order);
    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/orders/:id/bump — Kitchen bump order to next status
router.post('/:id/bump', authenticate, (req: Request, res: Response) => {
  try {
    const order = kitchenService.bumpOrder(req.params.id);

    if (order.status === 'ready') {
      emitOrderReady(order);
    }
    emitOrderUpdate(order);

    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

export default router;
