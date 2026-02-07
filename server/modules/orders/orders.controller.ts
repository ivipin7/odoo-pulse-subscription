import { Response, NextFunction } from 'express';
import { OrderService } from './orders.service';
import { AuthRequest } from '../../middleware/auth';

export const OrderController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await OrderService.getAll(req.user!.id, req.user!.role);
      res.json({ success: true, data: orders, total: orders.length });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getById(Number(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
  },
};
