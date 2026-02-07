import { z } from 'zod';

const discountBaseSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  min_order: z.number().min(0).default(0),
  max_uses: z.number().int().min(0).default(0),
  valid_from: z.string(),
  valid_until: z.string(),
});

export const createDiscountSchema = discountBaseSchema.refine(
  (d) => d.type !== 'PERCENTAGE' || d.value <= 100,
  { message: 'Percentage discount cannot exceed 100%', path: ['value'] }
);

export const updateDiscountSchema = discountBaseSchema.partial();

export const validateDiscountSchema = z.object({
  code: z.string().min(1),
  order_amount: z.number().positive(),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
