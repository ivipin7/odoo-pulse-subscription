import { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service';

export const ProductController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAllProducts();
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(Number(req.params.id));
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(Number(req.params.id), req.body);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(Number(req.params.id));
      res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
      next(err);
    }
  },

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ProductService.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  },
};
