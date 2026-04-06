import { Router, Request, Response } from 'express';
import { reportService } from '../services/report-service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All report routes require authentication and admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

// GET /api/reports/daily — Daily sales summary
router.get('/daily', (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const summary = reportService.getDailySummary(date);
    res.json(summary);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/weekly — Weekly summary
router.get('/weekly', (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const summary = reportService.getWeeklySummary(date);
    res.json(summary);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/monthly — Monthly summary
router.get('/monthly', (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const summary = reportService.getMonthlySummary(year, month);
    res.json(summary);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/popular-items — Top selling items
router.get('/popular-items', (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const items = reportService.getPopularItems(dateFrom, dateTo, limit);
    res.json(items);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/peak-hours — Orders grouped by hour
router.get('/peak-hours', (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;
    const hours = reportService.getPeakHours(dateFrom, dateTo);
    res.json(hours);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/category-revenue — Revenue breakdown by category
router.get('/category-revenue', (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;
    const revenue = reportService.getCategoryRevenue(dateFrom, dateTo);
    res.json(revenue);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/table-turnover — Table turnover stats
router.get('/table-turnover', (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;
    const turnover = reportService.getTableTurnover(dateFrom, dateTo);
    res.json(turnover);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

export default router;
