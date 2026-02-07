import { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';

export const UserController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAll();
      res.json({ success: true, data: users, total: users.length });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(Number(req.params.id));
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },
};
