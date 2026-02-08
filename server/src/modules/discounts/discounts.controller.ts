import { Request, Response, NextFunction } from "express";
import { discountsService } from "./discounts.service.js";
import { sendSuccess } from "../../utils/response.js";

export const discountsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await discountsService.list()); } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await discountsService.getById(req.params.id)); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await discountsService.create(req.body, req.user!.userId), "Discount created", 201); } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await discountsService.update(req.params.id, req.body), "Discount updated"); } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try { await discountsService.delete(req.params.id); sendSuccess(res, null, "Deleted"); } catch (err) { next(err); }
  },
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountsService.validate(req.body.discountId, req.body.subtotal, req.body.quantity);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async applyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountsService.validateByCode(req.body.code, req.body.subtotal, req.body.quantity);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },
};
