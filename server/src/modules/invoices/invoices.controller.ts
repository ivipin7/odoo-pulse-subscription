import { Request, Response, NextFunction } from "express";
import { invoicesService } from "./invoices.service.js";
import { sendSuccess, sendList } from "../../utils/response.js";

export const invoicesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        status: req.query.status as string | undefined,
        customerId: req.user?.role === "PORTAL" ? req.user.userId : req.query.customerId as string | undefined,
      };
      const { rows, total } = await invoicesService.list(page, limit, filters);
      sendList(res, rows, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoicesService.getById(req.params.id);
      sendSuccess(res, invoice);
    } catch (err) { next(err); }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      // PORTAL users can only generate invoices for their own subscriptions
      if (req.user?.role === "PORTAL") {
        const { subscriptionsService } = await import("../subscriptions/subscriptions.service.js");
        const sub = await subscriptionsService.getById(req.body.subscription_id);
        if (sub.customer_id !== req.user.userId) {
          return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "Access denied"));
        }
      }
      const invoice = await invoicesService.generateFromSubscription(req.body.subscription_id, req.user!.userId);
      sendSuccess(res, invoice, "Invoice generated", 201);
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // PORTAL users can only update their own invoices
      if (req.user?.role === "PORTAL") {
        const existing = await invoicesService.getById(req.params.id);
        if (existing.customer_id !== req.user.userId) {
          return next(new (await import("../../utils/AppError.js")).AppError(403, "FORBIDDEN", "Access denied"));
        }
      }
      const invoice = await invoicesService.updateStatus(req.params.id, req.body.status);
      sendSuccess(res, invoice, "Invoice status updated");
    } catch (err) { next(err); }
  },

  async generateRecurring(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoicesService.generateRecurringInvoices(req.user!.userId);
      sendSuccess(res, result, `Generated ${result.generated} invoices from ${result.total} due subscriptions`);
    } catch (err) { next(err); }
  },
};
