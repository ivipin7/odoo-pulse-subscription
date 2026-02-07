import { api } from "./api";
import type { Invoice } from "@/types";

export const invoicesService = {
  async getAll(): Promise<Invoice[]> {
    return api.get<Invoice[]>("/invoices");
  },

  async getById(id: number): Promise<Invoice> {
    return api.get<Invoice>(`/invoices/${id}`);
  },

  async create(data: Partial<Invoice>): Promise<Invoice> {
    return api.post<Invoice>("/invoices", data);
  },

  async updateStatus(
    id: number,
    status: Invoice["status"]
  ): Promise<Invoice> {
    return api.patch<Invoice>(`/invoices/${id}/status`, { status });
  },
};
