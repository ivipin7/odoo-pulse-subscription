import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../payments/payments.service';

/**
 * Recovery Controller — Admin dashboard for payment recovery
 * All endpoints are read-only (GET) — reporting and monitoring
 */
export const RecoveryController = {

  // ─────────────────────────────────────────────
  // GET /api/recovery/dashboard
  // ─────────────────────────────────────────────
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await PaymentService.getRecoveryDashboard();

      // Format for frontend KPI cards
      res.json({
        success: true,
        data: {
          failedPayments: parseInt(kpis.failed_count) || 0,
          atRiskSubscriptions: parseInt(kpis.at_risk_count) || 0,
          recoveredPayments: parseInt(kpis.recovered_count) || 0,
          closedSubscriptions: parseInt(kpis.closed_count) || 0,
          revenueAtRisk: parseFloat(kpis.revenue_at_risk) || 0,
          revenueRecovered: parseFloat(kpis.revenue_recovered) || 0,
          recoveryRate: parseInt(kpis.failed_count) > 0
            ? Math.round((parseInt(kpis.recovered_count) / (parseInt(kpis.recovered_count) + parseInt(kpis.failed_count))) * 100)
            : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────
  // GET /api/recovery/at-risk
  // ─────────────────────────────────────────────
  async getAtRiskSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await PaymentService.getAtRiskSubscriptions();

      // Format for frontend At-Risk table
      const formatted = subscriptions.map((row: any) => ({
        subscriptionId: row.subscription_id,
        subscriptionStatus: row.subscription_status,
        startDate: row.start_date,
        nextBilling: row.next_billing,
        billingPeriod: row.billing_period,
        subscriptionAmount: parseFloat(row.subscription_amount),
        customer: {
          id: row.user_id,
          name: row.customer_name,
          email: row.customer_email,
          company: row.customer_company,
          phone: row.customer_phone,
        },
        product: {
          name: row.product_name,
          price: parseFloat(row.product_price),
        },
        invoice: row.invoice_id ? {
          id: row.invoice_id,
          invoiceNumber: row.invoice_number,
          amount: parseFloat(row.invoice_amount),
          retryCount: row.retry_count,
          lastRetryAt: row.last_retry_at,
          status: row.invoice_status,
          dueDate: row.invoice_due_date,
          retriesRemaining: 3 - row.retry_count,
          canRetry: row.retry_count < 3 && row.invoice_status === 'FAILED',
        } : null,
        riskReason: row.retry_count >= 3
          ? 'All retry attempts exhausted'
          : `Payment failed — ${3 - row.retry_count} retries remaining`,
      }));

      res.json({
        success: true,
        data: formatted,
        total: formatted.length,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────
  // GET /api/recovery/timeline
  // ─────────────────────────────────────────────
  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const timeline = await PaymentService.getRecoveryTimeline(limit);

      // Format for frontend timeline display
      const formatted = timeline.map((row: any) => ({
        id: row.id,
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        paymentId: row.payment_id,
        attemptNumber: row.attempt_number,
        status: row.status,
        failureReason: row.failure_reason,
        attemptedAt: row.attempted_at,
        invoiceAmount: parseFloat(row.total_amount),
        totalRetries: row.retry_count,
        customer: {
          name: row.customer_name,
          email: row.customer_email,
        },
        subscription: {
          id: row.subscription_id,
          status: row.subscription_status,
        },
        product: {
          name: row.product_name,
        },
      }));

      res.json({
        success: true,
        data: formatted,
        total: formatted.length,
      });
    } catch (err) {
      next(err);
    }
  },
};
