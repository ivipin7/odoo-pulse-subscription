import { ProductRepository } from './products.repository';
import { CreateProductInput, UpdateProductInput } from './products.schema';

export const ProductService = {
  async getAllProducts() {
    return ProductRepository.findAll();
  },

  async getProductById(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    return product;
  },

  async createProduct(data: CreateProductInput) {
    const product = await ProductRepository.create({
      name: data.name,
      description: data.description,
      base_price: data.base_price,
      category_id: data.category_id,
      billing_period: data.billing_period,
    });

    // Create variants if provided
    if (data.variants?.length) {
      for (const variant of data.variants) {
        await ProductRepository.createVariant(product.id, variant);
      }
    }

    return ProductRepository.findById(product.id);
  },

  async updateProduct(id: number, data: UpdateProductInput) {
    const existing = await ProductRepository.findById(id);
    if (!existing) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };

    const { variants, ...productData } = data;
    return ProductRepository.update(id, productData);
  },

  async deleteProduct(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    await ProductRepository.softDelete(id);
  },

  async getCategories() {
    return ProductRepository.findCategories();
  },
};
