import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscriptions.service';
import { AuthRequest } from '../../middleware/auth';

export const SubscriptionController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subs = await SubscriptionService.getAll(req.user?.id, req.user?.role);
      res.json({ success: true, data: subs });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.getById(Number(req.params.id));
      res.json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.create(req.body);
      res.status(201).json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.updateStatus(Number(req.params.id), req.body.status);
      res.json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  },
};
