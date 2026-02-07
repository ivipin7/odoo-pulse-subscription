import { Request, Response, NextFunction } from 'express';
import { discountsService } from './discounts.service';
import { AuthRequest } from '../../middleware/auth';

export const discountsController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const discounts = await discountsService.getAllDiscounts(limit, offset);
      res.json({ success: true, data: discounts });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const discount = await discountsService.getDiscountById(req.params.id);
      res.json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const discount = await discountsService.createDiscount(req.body);
      res.status(201).json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const discount = await discountsService.updateDiscount(req.params.id, req.body);
      res.json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await discountsService.deleteDiscount(req.params.id);
      res.json({ success: true, message: 'Discount deleted' });
    } catch (err) {
      next(err);
    }
  },

  async validate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code, order_amount } = req.query;
      const result = await discountsService.validateDiscountCode(
        code as string,
        parseFloat(order_amount as string) || 0
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
