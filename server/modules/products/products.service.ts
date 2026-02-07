import { ProductRepository } from './products.repository';
import { CreateProductInput, UpdateProductInput } from './products.schema';
import { AppError } from '../../middleware/errorHandler';

export const ProductService = {
  async getAllProducts() {
    return ProductRepository.findAll();
  },

  async getProductById(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    return product;
  },

  async createProduct(data: CreateProductInput) {
    return ProductRepository.create(data);
  },

  async updateProduct(id: number, data: UpdateProductInput) {
    const existing = await ProductRepository.findById(id);
    if (!existing) throw new AppError('Product not found', 404, 'NOT_FOUND');
    return ProductRepository.update(id, data);
  },

  async deleteProduct(id: number) {
    const existing = await ProductRepository.findById(id);
    if (!existing) throw new AppError('Product not found', 404, 'NOT_FOUND');
    await ProductRepository.softDelete(id);
    return { message: 'Product deleted' };
  },
};
