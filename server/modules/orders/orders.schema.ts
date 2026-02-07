import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    variant_id: z.number().int().positive().nullable().optional(),
    quantity: z.number().int().positive().default(1),
    unit_price: z.number().positive(),
    billing_period: z.enum(['MONTHLY', 'SEMI_ANNUAL', 'ANNUAL']).default('MONTHLY'),
  })).min(1, 'At least one item required'),
  discount_amount: z.number().min(0).default(0),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
