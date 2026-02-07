import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AuthRequest } from '../../middleware/auth';

export const usersController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const users = await usersService.getAllUsers(limit, offset);
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await usersService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await usersService.getUserStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
};
