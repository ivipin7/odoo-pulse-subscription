import { Response, NextFunction } from 'express';
import { InvoiceService } from './invoices.service';
import { AuthRequest } from '../../middleware/auth';

export const InvoiceController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoices = await InvoiceService.getAll(req.user?.id, req.user?.role);
      res.json({ success: true, data: invoices, total: invoices.length });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.getById(Number(req.params.id));
      res.json({ success: true, data: invoice });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.create(req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) { next(err); }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.updateStatus(Number(req.params.id), req.body.status);
      res.json({ success: true, data: invoice });
    } catch (err) { next(err); }
  },
};
