import { z } from "zod";

export const createPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.enum(["CREDIT_CARD", "BANK_TRANSFER", "CASH", "OTHER"]).default("BANK_TRANSFER"),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
