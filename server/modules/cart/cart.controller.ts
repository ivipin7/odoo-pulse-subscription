import { Response, NextFunction } from 'express';
import { CartService } from './cart.service';
import { AuthRequest } from '../../middleware/auth';

export const CartController = {
  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await CartService.getCart(req.user!.id);
      res.json({ success: true, data: items, total: items.length });
    } catch (err) { next(err); }
  },

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await CartService.addItem(req.user!.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await CartService.updateItem(Number(req.params.id), req.user!.id, req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await CartService.removeItem(Number(req.params.id), req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
