import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id as string);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
