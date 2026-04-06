import db from '../config/database';
import { getStartOfDay, getEndOfDay, roundCurrency } from '../utils/helpers';

interface SalesSummary {
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  total_tax: number;
  total_discount: number;
  by_payment_method: { method: string; total: number; count: number }[];
  by_order_type: { order_type: string; total: number; count: number }[];
}

interface PopularItem {
  menu_item_id: string;
  name: string;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

interface PeakHour {
  hour: number;
  order_count: number;
  total_revenue: number;
}

interface CategoryRevenue {
  category_id: string;
  category_name: string;
  total_revenue: number;
  item_count: number;
  order_count: number;
}

interface TableTurnover {
  table_id: string;
  table_number: number;
  capacity: number;
  total_orders: number;
  avg_duration_minutes: number;
  total_revenue: number;
}

export class ReportService {
  getDailySummary(dateStr?: string): SalesSummary {
    const startOfDay = getStartOfDay(dateStr);
    const endOfDay = getEndOfDay(dateStr);
    return this.getSummary(startOfDay, endOfDay);
  }

  getWeeklySummary(dateStr?: string): SalesSummary & { daily_breakdown: { date: string; revenue: number; orders: number }[] } {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const start = getStartOfDay(startOfWeek.toISOString().split('T')[0]);
    const end = getEndOfDay(endOfWeek.toISOString().split('T')[0]);

    const summary = this.getSummary(start, end);

    const dailyBreakdown = db.prepare(`
      SELECT date(created_at) as date,
             COALESCE(SUM(total), 0) as revenue,
             COUNT(*) as orders
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
        AND status IN ('completed', 'served')
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `).all(start, end) as { date: string; revenue: number; orders: number }[];

    return { ...summary, daily_breakdown: dailyBreakdown };
  }

  getMonthlySummary(year?: number, month?: number): SalesSummary & { daily_breakdown: { date: string; revenue: number; orders: number }[] } {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = new Date(y, m, 0); // Last day of month
    const endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const start = getStartOfDay(startDate);
    const end = getEndOfDay(endDateStr);

    const summary = this.getSummary(start, end);

    const dailyBreakdown = db.prepare(`
      SELECT date(created_at) as date,
             COALESCE(SUM(total), 0) as revenue,
             COUNT(*) as orders
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
        AND status IN ('completed', 'served')
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `).all(start, end) as { date: string; revenue: number; orders: number }[];

    return { ...summary, daily_breakdown: dailyBreakdown };
  }

  getPopularItems(dateFrom?: string, dateTo?: string, limit: number = 10): PopularItem[] {
    let whereClause = "o.status IN ('completed', 'served')";
    const params: unknown[] = [];

    if (dateFrom) {
      whereClause += ' AND o.created_at >= ?';
      params.push(getStartOfDay(dateFrom));
    }
    if (dateTo) {
      whereClause += ' AND o.created_at <= ?';
      params.push(getEndOfDay(dateTo));
    }

    return db.prepare(`
      SELECT oi.menu_item_id,
             mi.name,
             c.name as category_name,
             SUM(oi.quantity) as total_quantity,
             SUM(oi.quantity * oi.unit_price) as total_revenue,
             COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE ${whereClause} AND oi.status != 'cancelled'
      GROUP BY oi.menu_item_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `).all(...params, limit) as PopularItem[];
  }

  getPeakHours(dateFrom?: string, dateTo?: string): PeakHour[] {
    let whereClause = "status IN ('completed', 'served')";
    const params: unknown[] = [];

    if (dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(getStartOfDay(dateFrom));
    }
    if (dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(getEndOfDay(dateTo));
    }

    return db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
             COUNT(*) as order_count,
             COALESCE(SUM(total), 0) as total_revenue
      FROM orders
      WHERE ${whereClause}
      GROUP BY hour
      ORDER BY hour
    `).all(...params) as PeakHour[];
  }

  getCategoryRevenue(dateFrom?: string, dateTo?: string): CategoryRevenue[] {
    let whereClause = "o.status IN ('completed', 'served')";
    const params: unknown[] = [];

    if (dateFrom) {
      whereClause += ' AND o.created_at >= ?';
      params.push(getStartOfDay(dateFrom));
    }
    if (dateTo) {
      whereClause += ' AND o.created_at <= ?';
      params.push(getEndOfDay(dateTo));
    }

    return db.prepare(`
      SELECT c.id as category_id,
             c.name as category_name,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue,
             COALESCE(SUM(oi.quantity), 0) as item_count,
             COUNT(DISTINCT oi.order_id) as order_count
      FROM categories c
      LEFT JOIN menu_items mi ON c.id = mi.category_id
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id AND oi.status != 'cancelled'
      LEFT JOIN orders o ON oi.order_id = o.id AND ${whereClause}
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `).all(...params) as CategoryRevenue[];
  }

  getTableTurnover(dateFrom?: string, dateTo?: string): TableTurnover[] {
    let whereClause = "o.status IN ('completed', 'served') AND o.table_id IS NOT NULL";
    const params: unknown[] = [];

    if (dateFrom) {
      whereClause += ' AND o.created_at >= ?';
      params.push(getStartOfDay(dateFrom));
    }
    if (dateTo) {
      whereClause += ' AND o.created_at <= ?';
      params.push(getEndOfDay(dateTo));
    }

    return db.prepare(`
      SELECT t.id as table_id,
             t.number as table_number,
             t.capacity,
             COUNT(o.id) as total_orders,
             AVG(
               CAST((julianday(o.updated_at) - julianday(o.created_at)) * 24 * 60 AS REAL)
             ) as avg_duration_minutes,
             COALESCE(SUM(o.total), 0) as total_revenue
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND ${whereClause}
      GROUP BY t.id
      ORDER BY t.number
    `).all(...params) as TableTurnover[];
  }

  private getSummary(startDate: string, endDate: string): SalesSummary {
    const orderStats = db.prepare(`
      SELECT COUNT(*) as order_count,
             COALESCE(SUM(total), 0) as total_revenue,
             COALESCE(AVG(total), 0) as avg_order_value,
             COALESCE(SUM(tax_amount), 0) as total_tax,
             COALESCE(SUM(discount_amount), 0) as total_discount
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
        AND status IN ('completed', 'served')
    `).get(startDate, endDate) as {
      order_count: number;
      total_revenue: number;
      avg_order_value: number;
      total_tax: number;
      total_discount: number;
    };

    const byPaymentMethod = db.prepare(`
      SELECT p.method,
             COALESCE(SUM(p.amount), 0) as total,
             COUNT(*) as count
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.created_at >= ? AND o.created_at <= ?
        AND o.status IN ('completed', 'served')
        AND p.status = 'completed'
      GROUP BY p.method
    `).all(startDate, endDate) as { method: string; total: number; count: number }[];

    const byOrderType = db.prepare(`
      SELECT order_type,
             COALESCE(SUM(total), 0) as total,
             COUNT(*) as count
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
        AND status IN ('completed', 'served')
      GROUP BY order_type
    `).all(startDate, endDate) as { order_type: string; total: number; count: number }[];

    return {
      total_revenue: roundCurrency(orderStats.total_revenue),
      order_count: orderStats.order_count,
      avg_order_value: roundCurrency(orderStats.avg_order_value),
      total_tax: roundCurrency(orderStats.total_tax),
      total_discount: roundCurrency(orderStats.total_discount),
      by_payment_method: byPaymentMethod,
      by_order_type: byOrderType,
    };
  }
}

export const reportService = new ReportService();
