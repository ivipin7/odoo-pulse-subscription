import { api } from "./api";
import type { TaxRule } from "@/types";

export const taxesService = {
  async getAll(): Promise<TaxRule[]> {
    return api.get<TaxRule[]>("/taxes");
  },

  async create(data: Partial<TaxRule>): Promise<TaxRule> {
    return api.post<TaxRule>("/taxes", data);
  },

  async update(id: number, data: Partial<TaxRule>): Promise<TaxRule> {
    return api.put<TaxRule>(`/taxes/${id}`, data);
  },
};
