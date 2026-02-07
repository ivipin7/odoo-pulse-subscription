import { Request, Response, NextFunction } from 'express';
import { quotationsService } from './quotations.service';
import { AuthRequest } from '../../middleware/auth';

export const quotationsController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const quotations = await quotationsService.getAllQuotations(limit, offset);
      res.json({ success: true, data: quotations });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationsService.getQuotationById(req.params.id);
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationsService.createQuotation(req.body);
      res.status(201).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationsService.updateQuotationStatus(req.params.id, req.body);
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await quotationsService.deleteQuotation(req.params.id);
      res.json({ success: true, message: 'Quotation deleted' });
    } catch (err) {
      next(err);
    }
  },
};
