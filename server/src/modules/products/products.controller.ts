import { Request, Response, NextFunction } from "express";
import { productsService } from "./products.service.js";
import { productsRepository } from "./products.repository.js";
import { sendSuccess, sendList } from "../../utils/response.js";

export const productsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const { rows, total } = await productsService.list(page, limit, search);
      sendList(res, rows, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getById(req.params.id);
      sendSuccess(res, product);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.create(req.body, req.user!.userId);
      sendSuccess(res, product, "Product created", 201);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      sendSuccess(res, product, "Product updated");
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await productsService.delete(req.params.id);
      sendSuccess(res, null, "Product deleted");
    } catch (err) { next(err); }
  },

  // --- Variants ---
  async getVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const variants = await productsRepository.getVariants(req.params.id);
      sendSuccess(res, variants);
    } catch (err) { next(err); }
  },

  async addVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { attribute_value_id, sku, price_override } = req.body;
      const variant = await productsRepository.createVariant(req.params.id, attribute_value_id, sku, price_override);
      sendSuccess(res, variant, "Variant added", 201);
    } catch (err) { next(err); }
  },

  async removeVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await productsRepository.deleteVariant(req.params.variantId);
      sendSuccess(res, null, "Variant removed");
    } catch (err) { next(err); }
  },

  // --- Attributes ---
  async listAttributes(_req: Request, res: Response, next: NextFunction) {
    try {
      const attrs = await productsRepository.listAttributes();
      sendSuccess(res, attrs);
    } catch (err) { next(err); }
  },

  async createAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const attr = await productsRepository.createAttribute(req.body.name);
      sendSuccess(res, attr, "Attribute created", 201);
    } catch (err) { next(err); }
  },

  async createAttributeValue(req: Request, res: Response, next: NextFunction) {
    try {
      const val = await productsRepository.createAttributeValue(req.params.attrId, req.body.value, req.body.extra_price || 0);
      sendSuccess(res, val, "Value added", 201);
    } catch (err) { next(err); }
  },
};
