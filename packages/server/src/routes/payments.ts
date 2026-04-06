import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment-service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { emitPaymentProcessed, emitTableUpdate, emitOrderUpdate } from '../socket/handlers';
import db from '../config/database';
import { ITable } from '../models/Table';

const router = Router();

const processPaymentSchema = z.object({
  order_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'card', 'mobile']),
  reference: z.string().optional(),
  tip_amount: z.number().min(0).optional(),
});

const splitEqualSchema = z.object({
  order_id: z.string().uuid(),
  number_of_splits: z.number().int().min(2),
  method: z.enum(['cash', 'card', 'mobile']),
});

const splitByItemsSchema = z.object({
  order_id: z.string().uuid(),
  splits: z.array(z.object({
    item_ids: z.array(z.string().uuid()).min(1),
    method: z.enum(['cash', 'card', 'mobile']),
  })).min(1),
});

const splitByPercentageSchema = z.object({
  order_id: z.string().uuid(),
  splits: z.array(z.object({
    percentage: z.number().min(0).max(100),
    method: z.enum(['cash', 'card', 'mobile']),
  })).min(1),
});

const discountSchema = z.object({
  order_id: z.string().uuid(),
  discount_amount: z.number().min(0),
});

// POST /api/payments — Process payment
router.post('/', authenticate, validate(processPaymentSchema), (req: Request, res: Response) => {
  try {
    const { payment, receipt, receiptData } = paymentService.processPayment(req.body);

    emitPaymentProcessed(payment);

    // If order is now completed, emit table update
    const order = db.prepare('SELECT table_id, status FROM orders WHERE id = ?').get(req.body.order_id) as { table_id: string | null; status: string } | undefined;
    if (order?.table_id && order.status === 'completed') {
      const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id) as ITable;
      emitTableUpdate(table);
    }
    if (order) {
      emitOrderUpdate({ id: req.body.order_id, status: order.status });
    }

    res.status(201).json({ payment, receipt, receiptData });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// GET /api/payments/order/:orderId — Get payments for an order
router.get('/order/:orderId', (req: Request, res: Response) => {
  try {
    const payments = paymentService.getPaymentsByOrder(req.params.orderId);
    res.json(payments);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/payments/:id/refund — Refund a payment
router.post('/:id/refund', authenticate, (req: Request, res: Response) => {
  try {
    const payment = paymentService.refundPayment(req.params.id);
    emitPaymentProcessed({ ...payment, action: 'refund' });
    res.json(payment);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/payments/split/equal — Split bill equally
router.post('/split/equal', authenticate, validate(splitEqualSchema), (req: Request, res: Response) => {
  try {
    const result = paymentService.splitBillEqual(
      req.body.order_id,
      req.body.number_of_splits,
      req.body.method
    );
    res.json(result);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/payments/split/by-items — Split bill by items
router.post('/split/by-items', authenticate, validate(splitByItemsSchema), (req: Request, res: Response) => {
  try {
    const result = paymentService.splitBillByItems(req.body.order_id, req.body.splits);
    res.json(result);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/payments/split/by-percentage — Split bill by percentage
router.post('/split/by-percentage', authenticate, validate(splitByPercentageSchema), (req: Request, res: Response) => {
  try {
    const result = paymentService.splitBillByPercentage(req.body.order_id, req.body.splits);
    res.json(result);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

// POST /api/payments/discount — Apply discount to order
router.post('/discount', authenticate, validate(discountSchema), (req: Request, res: Response) => {
  try {
    const order = paymentService.applyDiscount(req.body.order_id, req.body.discount_amount);
    emitOrderUpdate(order);
    res.json(order);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});

export default router;
