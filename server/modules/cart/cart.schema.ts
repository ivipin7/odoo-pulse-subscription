import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0), // 0 = remove
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
