import { z } from 'zod';

export const processPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  payment_method: z.enum(['CARD', 'UPI', 'BANK_TRANSFER', 'WALLET']),
  transaction_ref: z.string().optional(),
});

export const retryPaymentSchema = z.object({
  payment_method: z.enum(['CARD', 'UPI', 'BANK_TRANSFER', 'WALLET']).optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type RetryPaymentInput = z.infer<typeof retryPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
