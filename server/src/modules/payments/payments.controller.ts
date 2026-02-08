import { Request, Response, NextFunction } from "express";
import { paymentsService } from "./payments.service.js";
import { sendSuccess, sendList } from "../../utils/response.js";

export const paymentsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        status: req.query.status as string | undefined,
        customerId: req.user?.role === "PORTAL" ? req.user.userId : req.query.customerId as string | undefined,
      };
      const { rows, total } = await paymentsService.list(page, limit, filters);
      sendList(res, rows, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.getById(req.params.id);
      sendSuccess(res, payment);
    } catch (err) { next(err); }
  },

  async process(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.process(req.body, req.user!.userId);
      sendSuccess(res, payment, "Payment processed", 201);
    } catch (err) { next(err); }
  },

  async retry(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await paymentsService.retry(req.params.invoiceId);
      sendSuccess(res, invoice, "Payment retry initiated");
    } catch (err) { next(err); }
  },
};
