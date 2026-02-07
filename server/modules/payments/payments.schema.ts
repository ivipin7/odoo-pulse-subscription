import { z } from 'zod';

export const processPaymentSchema = z.object({
  invoice_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  amount: z.number().positive(),
  method: z.enum(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING']),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
