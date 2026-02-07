import { z } from 'zod';

export const createInvoiceSchema = z.object({
  subscription_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  amount: z.number().positive(),
  tax_amount: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  total_amount: z.number().positive(),
  due_date: z.string(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'FAILED', 'PAID']),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
