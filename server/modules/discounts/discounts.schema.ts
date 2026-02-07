import { z } from 'zod';

export const createDiscountSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().max(200).optional(),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive(),
  min_order_amount: z.number().min(0).default(0),
  max_uses: z.number().int().min(1).optional(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  is_active: z.boolean().default(true),
  applicable_products: z.array(z.string().uuid()).optional(),
});

export const updateDiscountSchema = createDiscountSchema.partial();

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
