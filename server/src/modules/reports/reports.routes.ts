import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import { db } from "../../db/pool.js";
import { sendSuccess } from "../../utils/response.js";

const router = Router();
router.use(authenticate);

// ────────────────────────────────────────────────
// KPI dashboard - role-aware
// ────────────────────────────────────────────────
router.get("/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;
    const isPortal = role === "PORTAL";

    const custFilter = isPortal ? " AND customer_id = $1" : "";
    const custParams = isPortal ? [userId] : [];

    const queries: Promise<any>[] = [
      db.query(`SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE'${custFilter}`, custParams),
      db.query(`SELECT COALESCE(SUM(total), 0) as revenue FROM invoices WHERE status = 'PAID'${custFilter}`, custParams),
      db.query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'COMPLETED'${isPortal ? " AND customer_id = $1" : ""}`, custParams),
      db.query(`SELECT COUNT(*) FROM invoices WHERE status = 'CONFIRMED' AND due_date < NOW()${custFilter}`, custParams),
      db.query(`SELECT status, COUNT(*) as count FROM subscriptions WHERE 1=1${custFilter} GROUP BY status`, custParams),
      db.query(
        isPortal
          ? `SELECT p.*, i.invoice_number FROM payments p
             JOIN invoices i ON p.invoice_id = i.id
             WHERE p.customer_id = $1
             ORDER BY p.created_at DESC LIMIT 5`
          : `SELECT p.*, i.invoice_number, u.first_name || ' ' || u.last_name as customer_name
             FROM payments p
             JOIN invoices i ON p.invoice_id = i.id
             JOIN users u ON p.customer_id = u.id
             ORDER BY p.created_at DESC LIMIT 5`,
        custParams
      ),
    ];

    // Admin-only: add at-risk subscription count
    if (!isPortal) {
      queries.push(
        db.query(`
          SELECT COUNT(*) as at_risk_count
          FROM subscriptions s
          WHERE s.status IN ('ACTIVE','CONFIRMED','QUOTATION')
            AND (
              EXISTS (SELECT 1 FROM invoices i WHERE i.customer_id = s.customer_id AND i.status = 'CONFIRMED' AND i.due_date < NOW())
              OR EXISTS (SELECT 1 FROM payments p JOIN invoices iv ON p.invoice_id = iv.id WHERE p.customer_id = s.customer_id AND p.status = 'FAILED')
              OR (s.expiration_date IS NOT NULL AND s.expiration_date < NOW() + interval '30 days')
            )
        `)
      );
    }

    const results = await Promise.all(queries);
    const [activeSubs, totalRevenue, totalPayments, overdueInvoices, subsByStatus, recentPayments] = results;

    const responseData: any = {
      activeSubscriptions: parseInt(activeSubs.rows[0].count, 10),
      totalRevenue: parseFloat(totalRevenue.rows[0].revenue),
      payments: {
        count: parseInt(totalPayments.rows[0].count, 10),
        total: parseFloat(totalPayments.rows[0].total),
      },
      overdueInvoices: parseInt(overdueInvoices.rows[0].count, 10),
      subscriptionsByStatus: subsByStatus.rows,
      recentPayments: recentPayments.rows,
    };

    if (!isPortal && results[6]) {
      responseData.atRiskCount = parseInt(results[6].rows[0].at_risk_count, 10);
    }

    sendSuccess(res, responseData);
  } catch (e) { next(e); }
});

// ────────────────────────────────────────────────
// Full summary KPIs (admin-only) with period filter
// ────────────────────────────────────────────────
router.get("/summary", authorize("ADMIN", "INTERNAL"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const [
      subsStats, invoiceStats, paymentStats, revenueStats,
      topCustomers, topProducts, subsByPlan,
      paymentsByMethod, invoicesByStatus
    ] = await Promise.all([
      // Subscription stats
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE status = 'DRAFT') as draft,
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
          COUNT(*) FILTER (WHERE status = 'CLOSED') as closed,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - interval '1 day' * $1) as new_period
        FROM subscriptions`, [days]),
      // Invoice stats
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'PAID') as paid,
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
          COUNT(*) FILTER (WHERE status = 'DRAFT') as draft,
          COUNT(*) FILTER (WHERE status = 'CONFIRMED' AND due_date < NOW()) as overdue,
          COALESCE(SUM(total) FILTER (WHERE status = 'CONFIRMED' AND due_date < NOW()), 0) as overdue_amount,
          COALESCE(SUM(total) FILTER (WHERE status = 'CONFIRMED'), 0) as outstanding
        FROM invoices`),
      // Payment stats
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
          COUNT(*) FILTER (WHERE status = 'REFUNDED') as refunded,
          COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) as total_collected,
          COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED' AND payment_date >= NOW() - interval '1 day' * $1), 0) as period_collected
        FROM payments`, [days]),
      // Revenue trend (monthly, last 12 months)
      db.query(`
        SELECT DATE_TRUNC('month', paid_date) as month,
               COUNT(*) as invoice_count,
               SUM(total) as revenue,
               SUM(tax_amount) as tax_collected,
               SUM(discount_amount) as discounts_given
        FROM invoices
        WHERE status = 'PAID' AND paid_date >= NOW() - interval '12 months'
        GROUP BY DATE_TRUNC('month', paid_date)
        ORDER BY month ASC`),
      // Top 5 customers by revenue
      db.query(`
        SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email,
               COUNT(DISTINCT i.id) as invoice_count,
               COALESCE(SUM(i.total), 0) as total_revenue,
               COUNT(DISTINCT s.id) as subscription_count
        FROM users u
        LEFT JOIN invoices i ON u.id = i.customer_id AND i.status = 'PAID'
        LEFT JOIN subscriptions s ON u.id = s.customer_id AND s.status = 'ACTIVE'
        WHERE u.role = 'PORTAL'
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_revenue DESC
        LIMIT 5`),
      // Top 5 products by subscription line revenue
      db.query(`
        SELECT p.id, p.name,
               COUNT(DISTINCT sl.subscription_id) as subscription_count,
               SUM(sl.subtotal) as total_revenue
        FROM products p
        JOIN subscription_lines sl ON p.id = sl.product_id
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 5`),
      // Subscriptions grouped by plan
      db.query(`
        SELECT COALESCE(rp.name, 'No Plan') as plan_name,
               COUNT(*) as count
        FROM subscriptions s
        LEFT JOIN recurring_plans rp ON s.recurring_plan_id = rp.id
        WHERE s.status IN ('ACTIVE', 'CONFIRMED')
        GROUP BY rp.name
        ORDER BY count DESC`),
      // Payments by method
      db.query(`
        SELECT payment_method, COUNT(*) as count,
               COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE status = 'COMPLETED'
        GROUP BY payment_method
        ORDER BY total DESC`),
      // Invoices by status
      db.query(`
        SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as amount
        FROM invoices GROUP BY status ORDER BY count DESC`),
    ]);

    sendSuccess(res, {
      period: days,
      subscriptions: subsStats.rows[0],
      invoices: invoiceStats.rows[0],
      payments: paymentStats.rows[0],
      revenueTrend: revenueStats.rows,
      topCustomers: topCustomers.rows,
      topProducts: topProducts.rows,
      subscriptionsByPlan: subsByPlan.rows,
      paymentsByMethod: paymentsByMethod.rows,
      invoicesByStatus: invoicesByStatus.rows,
    });
  } catch (e) { next(e); }
});

// ────────────────────────────────────────────────
// Revenue by month (configurable lookback)
// ────────────────────────────────────────────────
router.get("/revenue", authorize("ADMIN", "INTERNAL"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const result = await db.query(
      `SELECT DATE_TRUNC('month', paid_date) as month,
              COUNT(*) as invoice_count,
              SUM(total) as revenue,
              SUM(tax_amount) as tax_collected,
              SUM(discount_amount) as discounts_given
       FROM invoices
       WHERE status = 'PAID' AND paid_date >= NOW() - interval '1 month' * $1
       GROUP BY DATE_TRUNC('month', paid_date)
       ORDER BY month DESC`,
      [months]
    );
    sendSuccess(res, result.rows);
  } catch (e) { next(e); }
});

// ────────────────────────────────────────────────
// Overdue invoices list
// ────────────────────────────────────────────────
router.get("/overdue", authorize("ADMIN", "INTERNAL"), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      `SELECT i.*, u.first_name || ' ' || u.last_name as customer_name
       FROM invoices i JOIN users u ON i.customer_id = u.id
       WHERE i.status = 'CONFIRMED' AND i.due_date < NOW()
       ORDER BY i.due_date ASC`
    );
    sendSuccess(res, result.rows);
  } catch (e) { next(e); }
});

// ────────────────────────────────────────────────
// Subscription analytics
// ────────────────────────────────────────────────
router.get("/subscriptions", authorize("ADMIN", "INTERNAL"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 6;

    const [growth, mrr, churn] = await Promise.all([
      // New subscriptions by month
      db.query(`
        SELECT DATE_TRUNC('month', created_at) as month,
               COUNT(*) as new_subscriptions,
               COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_at_period
        FROM subscriptions
        WHERE created_at >= NOW() - interval '1 month' * $1
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC`, [months]),
      // MRR estimate (active sub lines total / billing period)
      db.query(`
        SELECT COALESCE(SUM(sl.subtotal), 0) as monthly_recurring_revenue
        FROM subscription_lines sl
        JOIN subscriptions s ON sl.subscription_id = s.id
        WHERE s.status = 'ACTIVE'`),
      // Closed subscriptions by month
      db.query(`
        SELECT DATE_TRUNC('month', updated_at) as month,
               COUNT(*) as closed
        FROM subscriptions
        WHERE status = 'CLOSED' AND updated_at >= NOW() - interval '1 month' * $1
        GROUP BY DATE_TRUNC('month', updated_at)
        ORDER BY month ASC`, [months]),
    ]);

    sendSuccess(res, {
      growth: growth.rows,
      mrr: parseFloat(mrr.rows[0].monthly_recurring_revenue),
      churn: churn.rows,
    });
  } catch (e) { next(e); }
});

// ────────────────────────────────────────────────
// Payment analytics
// ────────────────────────────────────────────────
router.get("/payments", authorize("ADMIN", "INTERNAL"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 6;

    const [trend, byMethod, recentFailed] = await Promise.all([
      db.query(`
        SELECT DATE_TRUNC('month', payment_date) as month,
               COUNT(*) as count,
               SUM(amount) as total,
               COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
               COUNT(*) FILTER (WHERE status = 'FAILED') as failed
        FROM payments
        WHERE payment_date >= NOW() - interval '1 month' * $1
        GROUP BY DATE_TRUNC('month', payment_date)
        ORDER BY month ASC`, [months]),
      db.query(`
        SELECT payment_method,
               COUNT(*) as count,
               COALESCE(SUM(amount), 0) as total
        FROM payments WHERE status = 'COMPLETED'
        GROUP BY payment_method ORDER BY total DESC`),
      db.query(`
        SELECT p.*, i.invoice_number, u.first_name || ' ' || u.last_name as customer_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN users u ON p.customer_id = u.id
        WHERE p.status = 'FAILED'
        ORDER BY p.created_at DESC LIMIT 10`),
    ]);

    sendSuccess(res, {
      trend: trend.rows,
      byMethod: byMethod.rows,
      recentFailed: recentFailed.rows,
    });
  } catch (e) { next(e); }
});

export const reportsRoutes = router;
