import { z } from 'zod';

const quotationItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().positive(),
});

export const createQuotationSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(quotationItemSchema).min(1),
  billing_period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  discount_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  valid_until: z.string().datetime().optional(),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED']),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;
