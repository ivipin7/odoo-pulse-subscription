import { Request, Response, NextFunction } from 'express';
import { DiscountService } from './discounts.service';

export const DiscountController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DiscountService.getAll();
      res.json({ success: true, data, total: data.length });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DiscountService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DiscountService.update(Number(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiscountService.validateCode(req.body.code, req.body.order_amount);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
