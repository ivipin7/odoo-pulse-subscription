import { api } from "./api";
import type { Subscription } from "@/types";

export const subscriptionsService = {
  async getAll(): Promise<Subscription[]> {
    return api.get<Subscription[]>("/subscriptions");
  },

  async getById(id: number): Promise<Subscription> {
    return api.get<Subscription>(`/subscriptions/${id}`);
  },

  async create(data: Partial<Subscription>): Promise<Subscription> {
    return api.post<Subscription>("/subscriptions", data);
  },

  async updateStatus(
    id: number,
    status: Subscription["status"]
  ): Promise<Subscription> {
    return api.patch<Subscription>(`/subscriptions/${id}/status`, { status });
  },
};
