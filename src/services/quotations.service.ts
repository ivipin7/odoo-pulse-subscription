import { api } from "./api";
import type { Quotation } from "@/types";

export const quotationsService = {
  async getAll(): Promise<Quotation[]> {
    return api.get<Quotation[]>("/quotations");
  },

  async getById(id: number): Promise<Quotation> {
    return api.get<Quotation>(`/quotations/${id}`);
  },

  async create(data: Partial<Quotation>): Promise<Quotation> {
    return api.post<Quotation>("/quotations", data);
  },

  async updateStatus(
    id: number,
    status: Quotation["status"]
  ): Promise<Quotation> {
    return api.patch<Quotation>(`/quotations/${id}/status`, { status });
  },
};
