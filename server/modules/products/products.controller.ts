import { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service';

export const ProductController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAllProducts();
      res.json({ success: true, data: products, total: products.length });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(Number(req.params.id));
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(Number(req.params.id), req.body);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.deleteProduct(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
