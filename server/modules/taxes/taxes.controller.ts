import { Request, Response, NextFunction } from 'express';
import { taxesService } from './taxes.service';
import { AuthRequest } from '../../middleware/auth';

export const taxesController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const rules = await taxesService.getAllTaxRules(limit, offset);
      res.json({ success: true, data: rules });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rule = await taxesService.getTaxRuleById(req.params.id);
      res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rule = await taxesService.createTaxRule(req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rule = await taxesService.updateTaxRule(req.params.id, req.body);
      res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await taxesService.deleteTaxRule(req.params.id);
      res.json({ success: true, message: 'Tax rule deleted' });
    } catch (err) {
      next(err);
    }
  },

  async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount, region } = req.query;
      const result = await taxesService.calculateTax(
        parseFloat(amount as string) || 0,
        region as string
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
