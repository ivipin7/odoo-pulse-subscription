import { z } from 'zod';

export const addCartItemSchema = z.object({
  product_id: z.number().int().positive(),
  variant_id: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
