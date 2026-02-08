import { Request, Response, NextFunction } from "express";
import { subscriptionsService } from "./subscriptions.service.js";
import { sendSuccess, sendList } from "../../utils/response.js";
import { db } from "../../db/pool.js";

export const subscriptionsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        status: req.query.status as string | undefined,
        customerId: req.user?.role === "PORTAL" ? req.user.userId : req.query.customerId as string | undefined,
        search: req.query.search as string | undefined,
      };
      const { rows, total } = await subscriptionsService.list(page, limit, filters);
      sendList(res, rows, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionsService.getById(req.params.id);
      // RBAC: customers can only see their own
      if (req.user?.role === "PORTAL" && sub.customer_id !== req.user.userId) {
        return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "Access denied"));
      }
      sendSuccess(res, sub);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionsService.create(req.body, req.user!.userId);
      sendSuccess(res, sub, "Subscription created", 201);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionsService.update(req.params.id, req.body);
      sendSuccess(res, sub, "Subscription updated");
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, cancellation_reason } = req.body;

      if (req.user?.role === "PORTAL") {
        const existing = await subscriptionsService.getById(req.params.id);
        if (existing.customer_id !== req.user.userId) {
          return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "Access denied"));
        }
        // PORTAL allowed transitions: DRAFT→QUOTATION, ACTIVE→PAUSED, PAUSED→ACTIVE, ACTIVE→CANCELLED, PAUSED→CANCELLED
        const portalAllowed: Record<string, string[]> = {
          DRAFT: ["QUOTATION"],
          ACTIVE: ["PAUSED", "CANCELLED"],
          PAUSED: ["ACTIVE", "CANCELLED"],
        };
        const allowed = portalAllowed[existing.status] || [];
        if (!allowed.includes(status)) {
          return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "You are not allowed to perform this action"));
        }
      }
      const sub = await subscriptionsService.updateStatus(req.params.id, status, cancellation_reason);
      sendSuccess(res, sub, "Status updated");
    } catch (err) { next(err); }
  },

  async renew(req: Request, res: Response, next: NextFunction) {
    try {
      // PORTAL users can only renew their own subscriptions
      if (req.user?.role === "PORTAL") {
        const existing = await subscriptionsService.getById(req.params.id);
        if (existing.customer_id !== req.user.userId) {
          return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "Access denied"));
        }
      }
      const newSub = await subscriptionsService.renew(req.params.id, req.user!.userId);
      sendSuccess(res, newSub, "Subscription renewed — a new draft has been created", 201);
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await subscriptionsService.delete(req.params.id);
      sendSuccess(res, null, "Subscription deleted");
    } catch (err) { next(err); }
  },

  async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionsService.getById(req.params.id);

      // RBAC: PORTAL can only see their own
      if (req.user?.role === "PORTAL" && sub.customer_id !== req.user.userId) {
        return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "Access denied"));
      }

      // Get plan billing details
      let billingPeriod = "MONTHLY";
      let billingInterval = 1;
      if (sub.recurring_plan_id) {
        const planRes = await db.query("SELECT billing_period, billing_interval FROM recurring_plans WHERE id = $1", [sub.recurring_plan_id]);
        if (planRes.rows[0]) {
          billingPeriod = planRes.rows[0].billing_period;
          billingInterval = planRes.rows[0].billing_interval;
        }
      }

      const startDate = sub.start_date ? new Date(sub.start_date) : new Date(sub.created_at);
      const now = new Date();

      // Calculate cycle length in days based on billing period
      const cycleDaysMap: Record<string, number> = { DAILY: 1, WEEKLY: 7, MONTHLY: 30, YEARLY: 365 };
      const cycleDays = (cycleDaysMap[billingPeriod] || 30) * billingInterval;

      // Find which billing cycle we're in
      const totalDaysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const currentCycleNumber = Math.floor(totalDaysSinceStart / cycleDays) + 1;
      const daysIntoCycle = totalDaysSinceStart % cycleDays;
      const daysRemaining = cycleDays - daysIntoCycle;
      const progressPercent = Math.min(100, Math.round((daysIntoCycle / cycleDays) * 100));

      // Calculate cycle start and next billing date
      const cycleStartDate = new Date(startDate);
      cycleStartDate.setDate(cycleStartDate.getDate() + (currentCycleNumber - 1) * cycleDays);
      const nextBillingDate = new Date(cycleStartDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + cycleDays);

      // Count invoices for this subscription
      const invoiceRes = await db.query(
        `SELECT COUNT(*) as total_invoices,
                COUNT(*) FILTER (WHERE status = 'PAID') as paid_invoices,
                COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0) as total_paid
         FROM invoices WHERE subscription_id = $1`,
        [sub.id]
      );
      const invoiceStats = invoiceRes.rows[0];

      sendSuccess(res, {
        subscription_id: sub.id,
        subscription_number: sub.subscription_number,
        status: sub.status,
        billing_period: billingPeriod,
        billing_interval: billingInterval,
        cycle_days: cycleDays,
        current_cycle: currentCycleNumber,
        days_into_cycle: daysIntoCycle,
        days_remaining: daysRemaining,
        progress_percent: progressPercent,
        cycle_start_date: cycleStartDate.toISOString().split("T")[0],
        next_billing_date: nextBillingDate.toISOString().split("T")[0],
        start_date: sub.start_date,
        expiration_date: sub.expiration_date,
        paused_at: sub.paused_at || null,
        resumed_at: sub.resumed_at || null,
        cancelled_at: sub.cancelled_at || null,
        cancellation_reason: sub.cancellation_reason || null,
        total_invoices: parseInt(invoiceStats.total_invoices),
        paid_invoices: parseInt(invoiceStats.paid_invoices),
        total_paid: parseFloat(invoiceStats.total_paid),
      });
    } catch (err) { next(err); }
  },
};
