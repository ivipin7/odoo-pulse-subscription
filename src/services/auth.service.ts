import { api } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const result = await api.post<AuthResponse>("/auth/login", data);
    localStorage.setItem("token", result.token);
    return result;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const result = await api.post<AuthResponse>("/auth/register", data);
    localStorage.setItem("token", result.token);
    return result;
  },

  async getMe(): Promise<User> {
    return api.get<User>("/auth/me");
  },

  logout(): void {
    localStorage.removeItem("token");
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },
};
