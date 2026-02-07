import { Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { AuthRequest } from '../../middleware/auth';

export const cartController = {
  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.getCart(req.user!.id);
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  },

  async addToCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await cartService.addToCart(req.user!.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await cartService.updateCartItem(req.user!.id, req.params.itemId, req.body);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await cartService.removeFromCart(req.user!.id, req.params.itemId);
      res.json({ success: true, message: 'Item removed' });
    } catch (err) {
      next(err);
    }
  },

  async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await cartService.clearCart(req.user!.id);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (err) {
      next(err);
    }
  },
};
