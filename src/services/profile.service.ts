import { api } from "./api";
import type { UserProfile, Address } from "@/types";

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>("/profile");
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return api.put<UserProfile>("/profile", data);
  },

  async addAddress(data: Omit<Address, "id" | "userId">): Promise<Address> {
    return api.post<Address>("/profile/addresses", data);
  },

  async updateAddress(
    id: number,
    data: Partial<Address>
  ): Promise<Address> {
    return api.put<Address>(`/profile/addresses/${id}`, data);
  },

  async deleteAddress(id: number): Promise<void> {
    return api.delete<void>(`/profile/addresses/${id}`);
  },
};
