import { api } from "./api";
import type { Discount } from "@/types";

export const discountsService = {
  async getAll(): Promise<Discount[]> {
    return api.get<Discount[]>("/discounts");
  },

  async create(data: Partial<Discount>): Promise<Discount> {
    return api.post<Discount>("/discounts", data);
  },

  async update(id: number, data: Partial<Discount>): Promise<Discount> {
    return api.put<Discount>(`/discounts/${id}`, data);
  },

  async validate(code: string): Promise<Discount> {
    return api.post<Discount>("/discounts/validate", { code });
  },
};
