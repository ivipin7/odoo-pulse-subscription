import { Request, Response, NextFunction } from 'express';
import { TaxService } from './taxes.service';

export const TaxController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TaxService.getAll();
      res.json({ success: true, data, total: data.length });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TaxService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TaxService.update(Number(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
