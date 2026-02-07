import { api } from "./api";
import type { User } from "@/types";

export const usersService = {
  async getAll(): Promise<User[]> {
    return api.get<User[]>("/users");
  },

  async getById(id: number): Promise<User> {
    return api.get<User>(`/users/${id}`);
  },

  async update(
    id: number,
    data: { role?: User["role"]; status?: User["status"] }
  ): Promise<User> {
    return api.patch<User>(`/users/${id}`, data);
  },
};
