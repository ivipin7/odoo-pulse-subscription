import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { AuthRequest } from '../../middleware/auth';

export const profileController = {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await profileService.changePassword(req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
