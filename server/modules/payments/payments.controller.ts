import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payments.service';

/**
 * Payments Controller — HTTP layer ONLY
 * No business logic here. Just parse request, call service, return response.
 */
export const PaymentController = {

  // ─────────────────────────────────────────────
  // POST /api/payments/process
  // ─────────────────────────────────────────────
  async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { invoiceId, method } = req.body;
      const result = await PaymentService.processPayment(invoiceId, method);

      res.status(result.success ? 200 : 200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────
  // POST /api/payments/retry/:invoiceId
  // ─────────────────────────────────────────────
  async retryPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = parseInt(req.params.invoiceId as string, 10);
      if (isNaN(invoiceId) || invoiceId <= 0) {
        throw new Error('Invalid invoice ID');
      }

      const result = await PaymentService.retryPayment(invoiceId);

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────
  // GET /api/payments
  // ─────────────────────────────────────────────
  async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, limit, offset } = req.query;

      const result = await PaymentService.getAllPayments({
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result.rows,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────
  // GET /api/payments/:id
  // ─────────────────────────────────────────────
  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid payment ID');
      }

      const payment = await PaymentService.getPaymentById(id);
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────
  // POST /api/payments/demo/force
  // Demo-only: force next payment to succeed or fail
  // ─────────────────────────────────────────────
  async demoForceResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { result } = req.body;

      if (result === 'success') {
        PaymentService.forceNextSuccess();
      } else if (result === 'failure') {
        PaymentService.forceNextFailure();
      } else {
        throw new Error('Invalid demo force value. Use "success" or "failure".');
      }

      res.json({
        success: true,
        message: `Next payment attempt will be forced to ${result.toUpperCase()}`,
      });
    } catch (err) {
      next(err);
    }
  },
};
