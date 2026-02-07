import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  billing_address: z.string().min(10).optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
