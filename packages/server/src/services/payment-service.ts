import db from '../config/database';
import { config } from '../config/env';
import { generateUUID, roundCurrency, calculateTax } from '../utils/helpers';
import { IPayment, IReceiptData } from '../models/Payment';
import { IOrder, IOrderItemWithDetails } from '../models/Order';
import { NotFoundError, ValidationError } from '../middleware/error';
import { generateReceiptText } from '../utils/receipt';

interface ProcessPaymentInput {
  order_id: string;
  amount: number;
  method: 'cash' | 'card' | 'mobile';
  reference?: string;
  tip_amount?: number;
}

interface SplitBillResult {
  payments: IPayment[];
  remaining: number;
}

export class PaymentService {
  processPayment(input: ProcessPaymentInput): { payment: IPayment; receipt: string; receiptData: IReceiptData } {
    const order = db.prepare(`
      SELECT o.*, t.number as table_number, u.name as staff_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE o.id = ?
    `).get(input.order_id) as (IOrder & { table_number?: number; staff_name?: string }) | undefined;

    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.status === 'cancelled') {
      throw new ValidationError('Cannot process payment for a cancelled order.');
    }

    // Calculate how much has already been paid
    const existingPayments = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as paid
      FROM payments
      WHERE order_id = ? AND status = 'completed'
    `).get(input.order_id) as { paid: number };

    const remainingAmount = roundCurrency(order.total - existingPayments.paid);

    if (remainingAmount <= 0) {
      throw new ValidationError('Order has already been fully paid.');
    }

    const tipAmount = input.tip_amount ?? 0;
    let changeAmount = 0;
    let paymentAmount = input.amount;

    if (input.method === 'cash') {
      if (input.amount < remainingAmount) {
        // Allow partial cash payment
        paymentAmount = input.amount;
      } else {
        changeAmount = roundCurrency(input.amount - remainingAmount - tipAmount);
        paymentAmount = remainingAmount;
      }
    } else {
      // For card/mobile, the amount should match or be partial
      if (input.amount > remainingAmount + tipAmount) {
        paymentAmount = remainingAmount;
      } else {
        paymentAmount = Math.min(input.amount, remainingAmount);
      }
    }

    const paymentId = generateUUID();

    const paymentTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO payments (id, order_id, amount, method, status, reference, change_amount, tip_amount)
        VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)
      `).run(
        paymentId,
        input.order_id,
        paymentAmount,
        input.method,
        input.reference ?? null,
        changeAmount,
        tipAmount
      );

      // Check if order is fully paid
      const totalPaid = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as paid
        FROM payments
        WHERE order_id = ? AND status = 'completed'
      `).get(input.order_id) as { paid: number };

      if (totalPaid.paid >= order.total) {
        // Mark order as completed
        db.prepare(`
          UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?
        `).run(input.order_id);

        // Free table
        if (order.table_id) {
          db.prepare(`
            UPDATE tables SET status = 'needs_cleaning', current_order_id = NULL WHERE id = ?
          `).run(order.table_id);
        }
      }
    });

    paymentTx();

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as IPayment;

    // Generate receipt
    const receiptData = this.generateReceiptData(input.order_id);
    const receipt = generateReceiptText(receiptData);

    return { payment, receipt, receiptData };
  }

  getPaymentsByOrder(orderId: string): IPayment[] {
    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    return db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at').all(orderId) as IPayment[];
  }

  refundPayment(paymentId: string): IPayment {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as IPayment | undefined;
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.status !== 'completed') {
      throw new ValidationError('Can only refund completed payments.');
    }

    db.prepare(`UPDATE payments SET status = 'refunded' WHERE id = ?`).run(paymentId);

    // Update order total paid status
    const totalPaid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as paid
      FROM payments
      WHERE order_id = ? AND status = 'completed'
    `).get(payment.order_id) as { paid: number };

    const order = db.prepare('SELECT total, status FROM orders WHERE id = ?').get(payment.order_id) as { total: number; status: string };

    if (totalPaid.paid < order.total && order.status === 'completed') {
      db.prepare(`UPDATE orders SET status = 'served', updated_at = datetime('now') WHERE id = ?`).run(payment.order_id);
    }

    return db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as IPayment;
  }

  splitBillEqual(orderId: string, numberOfSplits: number, method: 'cash' | 'card' | 'mobile'): SplitBillResult {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (numberOfSplits < 2) {
      throw new ValidationError('Number of splits must be at least 2.');
    }

    const splitAmount = roundCurrency(order.total / numberOfSplits);
    const payments: IPayment[] = [];

    for (let i = 0; i < numberOfSplits; i++) {
      // Last split gets any remainder to handle rounding
      const amount = i === numberOfSplits - 1
        ? roundCurrency(order.total - splitAmount * (numberOfSplits - 1))
        : splitAmount;

      const { payment } = this.processPayment({
        order_id: orderId,
        amount,
        method,
      });
      payments.push(payment);
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return { payments, remaining: roundCurrency(order.total - totalPaid) };
  }

  splitBillByItems(orderId: string, splits: { item_ids: string[]; method: 'cash' | 'card' | 'mobile' }[]): SplitBillResult {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    const payments: IPayment[] = [];

    for (const split of splits) {
      const items = db.prepare(`
        SELECT SUM(quantity * unit_price) as total
        FROM order_items
        WHERE order_id = ? AND id IN (${split.item_ids.map(() => '?').join(',')})
      `).get(orderId, ...split.item_ids) as { total: number };

      if (!items.total) continue;

      // Add proportional tax
      const proportion = items.total / order.subtotal;
      const taxPortion = roundCurrency(order.tax_amount * proportion);
      const discountPortion = roundCurrency(order.discount_amount * proportion);
      const amount = roundCurrency(items.total + taxPortion - discountPortion);

      const { payment } = this.processPayment({
        order_id: orderId,
        amount,
        method: split.method,
      });
      payments.push(payment);
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return { payments, remaining: roundCurrency(order.total - totalPaid) };
  }

  splitBillByPercentage(orderId: string, splits: { percentage: number; method: 'cash' | 'card' | 'mobile' }[]): SplitBillResult {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new ValidationError('Percentages must sum to 100.');
    }

    const payments: IPayment[] = [];

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      let amount: number;

      if (i === splits.length - 1) {
        // Last split gets the remainder
        const paidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);
        amount = roundCurrency(order.total - paidSoFar);
      } else {
        amount = roundCurrency(order.total * (split.percentage / 100));
      }

      const { payment } = this.processPayment({
        order_id: orderId,
        amount,
        method: split.method,
      });
      payments.push(payment);
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return { payments, remaining: roundCurrency(order.total - totalPaid) };
  }

  applyDiscount(orderId: string, discountAmount: number): IOrder {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as IOrder | undefined;
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (discountAmount < 0) {
      throw new ValidationError('Discount cannot be negative.');
    }

    if (discountAmount > order.subtotal) {
      throw new ValidationError('Discount cannot exceed subtotal.');
    }

    const taxableAmount = order.subtotal - discountAmount;
    const taxAmount = calculateTax(Math.max(0, taxableAmount));
    const total = roundCurrency(Math.max(0, taxableAmount) + taxAmount);

    db.prepare(`
      UPDATE orders SET discount_amount = ?, tax_amount = ?, total = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(discountAmount, taxAmount, total, orderId);

    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as IOrder;
  }

  generateReceiptData(orderId: string): IReceiptData {
    const order = db.prepare(`
      SELECT o.*, t.number as table_number, u.name as staff_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.staff_id = u.id
      WHERE o.id = ?
    `).get(orderId) as (IOrder & { table_number?: number; staff_name?: string }) | undefined;

    if (!order) {
      throw new NotFoundError('Order');
    }

    const items = db.prepare(`
      SELECT oi.*, mi.name as menu_item_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ? AND oi.status != 'cancelled'
      ORDER BY oi.created_at
    `).all(orderId) as IOrderItemWithDetails[];

    const payments = db.prepare(`
      SELECT * FROM payments WHERE order_id = ? AND status = 'completed' ORDER BY created_at
    `).all(orderId) as IPayment[];

    return {
      restaurantName: config.restaurant.name,
      restaurantAddress: config.restaurant.address,
      restaurantPhone: config.restaurant.phone,
      vatNumber: config.restaurant.vatNumber,
      orderNumber: order.order_number,
      orderType: order.order_type,
      tableName: order.table_number ? `Table ${order.table_number}` : null,
      date: order.created_at,
      items: items.map((item) => ({
        name: item.menu_item_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: roundCurrency(item.quantity * item.unit_price),
        modifications: item.modifications ? JSON.parse(item.modifications) : undefined,
      })),
      subtotal: order.subtotal,
      taxRate: config.taxRate,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount,
      total: order.total,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        change: p.change_amount,
        tip: p.tip_amount,
      })),
      staffName: order.staff_name ?? 'Unknown',
    };
  }
}

export const paymentService = new PaymentService();
