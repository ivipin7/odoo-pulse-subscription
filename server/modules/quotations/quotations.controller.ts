import { Request, Response, NextFunction } from 'express';
import { QuotationService } from './quotations.service';

export const QuotationController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuotationService.getAll();
      res.json({ success: true, data, total: data.length });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuotationService.getById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuotationService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuotationService.updateStatus(Number(req.params.id), req.body.status);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
