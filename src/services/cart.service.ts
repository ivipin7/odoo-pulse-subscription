import { api } from "./api";
import type { CartItem } from "@/types";

export const cartService = {
  async getItems(): Promise<CartItem[]> {
    return api.get<CartItem[]>("/cart");
  },

  async addItem(data: {
    productId: number;
    variantId?: number;
    quantity: number;
  }): Promise<CartItem> {
    return api.post<CartItem>("/cart", data);
  },

  async updateQuantity(id: number, quantity: number): Promise<CartItem> {
    return api.put<CartItem>(`/cart/${id}`, { quantity });
  },

  async removeItem(id: number): Promise<void> {
    return api.delete<void>(`/cart/${id}`);
  },
};
