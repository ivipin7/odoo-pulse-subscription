import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { AuthRequest } from '../../middleware/auth';

export const ordersController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const orders = req.user!.role === 'CUSTOMER'
        ? await ordersService.getOrdersByUser(req.user!.id, limit, offset)
        : await ordersService.getAllOrders(limit, offset);
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.createOrder(req.body, req.user!.id);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.updateOrderStatus(req.params.id, req.body);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },
};
