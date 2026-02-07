import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  user_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  variant_id: z.number().int().positive().optional(),
  billing_period: z.enum(['MONTHLY', 'SEMI_ANNUAL', 'ANNUAL']).default('MONTHLY'),
  amount: z.number().positive(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'QUOTATION', 'ACTIVE', 'AT_RISK', 'CLOSED']),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
