import { Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { AuthRequest } from '../../middleware/auth';

export const ProfileController = {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) { next(err); }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: profile });
    } catch (err) { next(err); }
  },

  async getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await ProfileService.getAddresses(req.user!.id);
      res.json({ success: true, data: addresses });
    } catch (err) { next(err); }
  },

  async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const address = await ProfileService.addAddress(req.user!.id, req.body);
      res.status(201).json({ success: true, data: address });
    } catch (err) { next(err); }
  },

  async updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const address = await ProfileService.updateAddress(Number(req.params.id), req.user!.id, req.body);
      res.json({ success: true, data: address });
    } catch (err) { next(err); }
  },

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ProfileService.deleteAddress(Number(req.params.id), req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
