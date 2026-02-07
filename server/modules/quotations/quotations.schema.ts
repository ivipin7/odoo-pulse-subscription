import { z } from 'zod';

export const createQuotationSchema = z.object({
  user_id: z.number().int().positive(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    variant_id: z.number().int().positive().nullable().optional(),
    quantity: z.number().int().positive().default(1),
    unit_price: z.number().positive(),
  })).min(1),
  valid_until: z.string(),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED']),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
