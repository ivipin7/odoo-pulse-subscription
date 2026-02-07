import { api } from "./api";
import type { Order } from "@/types";

export const ordersService = {
  async getAll(): Promise<Order[]> {
    return api.get<Order[]>("/orders");
  },

  async getById(id: number): Promise<Order> {
    return api.get<Order>(`/orders/${id}`);
  },

  async create(data: Partial<Order>): Promise<Order> {
    return api.post<Order>("/orders", data);
  },
};
