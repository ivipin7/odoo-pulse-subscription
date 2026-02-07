import { api } from "./api";
import type {
  Payment,
  RecoveryDashboard,
  RetryResult,
  Subscription,
  PaymentRetry,
} from "@/types";

export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    return api.get<Payment[]>("/payments");
  },

  async getById(id: number): Promise<Payment> {
    return api.get<Payment>(`/payments/${id}`);
  },

  async processPayment(invoiceId: number): Promise<Payment> {
    return api.post<Payment>("/payments/process", { invoiceId });
  },

  async retryPayment(invoiceId: number): Promise<RetryResult> {
    return api.post<RetryResult>(`/payments/retry/${invoiceId}`);
  },

  async getRecoveryDashboard(): Promise<RecoveryDashboard> {
    return api.get<RecoveryDashboard>("/recovery/dashboard");
  },

  async getAtRiskSubscriptions(): Promise<Subscription[]> {
    return api.get<Subscription[]>("/recovery/at-risk");
  },

  async getRecoveryTimeline(): Promise<PaymentRetry[]> {
    return api.get<PaymentRetry[]>("/recovery/timeline");
  },
};
