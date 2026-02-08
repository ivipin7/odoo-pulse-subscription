import { productsRepository } from "./products.repository.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateProductInput, UpdateProductInput } from "./products.schema.js";

export const productsService = {
  async list(page: number, limit: number, search?: string) {
    return productsRepository.findAll(page, limit, search);
  },

  async getById(id: string) {
    const product = await productsRepository.findById(id);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
    const variants = await productsRepository.getVariants(id);
    return { ...product, variants };
  },

  async create(data: CreateProductInput, userId: string) {
    return productsRepository.create(data, userId);
  },

  async update(id: string, data: UpdateProductInput) {
    const product = await productsRepository.update(id, data);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
    return product;
  },

  async delete(id: string) {
    const result = await productsRepository.delete(id);
    if (!result) throw new AppError(404, "NOT_FOUND", "Product not found");
    return result;
  },
};
