import { api } from "./api";
import type { Product } from "@/types";

export const productsService = {
  async getAll(): Promise<Product[]> {
    return api.get<Product[]>("/products");
  },

  async getById(id: number): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  },

  async create(data: Partial<Product>): Promise<Product> {
    return api.post<Product>("/products", data);
  },

  async update(id: number, data: Partial<Product>): Promise<Product> {
    return api.put<Product>(`/products/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return api.delete<void>(`/products/${id}`);
  },
};
