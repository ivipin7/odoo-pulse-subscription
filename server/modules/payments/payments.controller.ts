import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { AuthRequest } from '../../middleware/auth';

export const paymentsController = {
  async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.processPayment(req.body, req.user!.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async retryPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.retryPayment(req.params.invoiceId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const payments = req.user!.role === 'CUSTOMER'
        ? await paymentsService.getPaymentsByUser(req.user!.id, limit, offset)
        : await paymentsService.getAllPayments(limit, offset);
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.getPaymentById(req.params.id);
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },

  async getByInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await paymentsService.getPaymentsByInvoice(req.params.invoiceId);
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  },

  async getRetryHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const retries = await paymentsService.getRetryHistory(req.params.invoiceId);
      res.json({ success: true, data: retries });
    } catch (err) {
      next(err);
    }
  },

  // ── Recovery Dashboard ─────────────────────────────────────────

  async getRecoveryDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await paymentsService.getRecoveryDashboard();
      res.json({ success: true, data: dashboard });
    } catch (err) {
      next(err);
    }
  },

  async getAtRiskSubscriptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const subscriptions = await paymentsService.getAtRiskSubscriptions(limit);
      res.json({ success: true, data: subscriptions });
    } catch (err) {
      next(err);
    }
  },

  async getRecoveryTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const timeline = await paymentsService.getRecoveryTimeline(days);
      res.json({ success: true, data: timeline });
    } catch (err) {
      next(err);
    }
  },
};
