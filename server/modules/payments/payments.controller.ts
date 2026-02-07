import { Response, NextFunction } from 'express';
import { PaymentService } from './payments.service';
import { AuthRequest } from '../../middleware/auth';

export const PaymentController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await PaymentService.getAll(req.user?.id, req.user?.role);
      res.json({ success: true, data: payments, total: payments.length });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.getById(Number(req.params.id));
      res.json({ success: true, data: payment });
    } catch (err) { next(err); }
  },

  async process(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.processPayment(req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (err) { next(err); }
  },

  async retry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.retryPayment(Number(req.params.invoiceId));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async dashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.getRecoveryDashboard();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async atRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.getAtRiskSubscriptions();
      res.json({ success: true, data, total: data.length });
    } catch (err) { next(err); }
  },

  async timeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.getRecoveryTimeline();
      res.json({ success: true, data, total: data.length });
    } catch (err) { next(err); }
  },
};
