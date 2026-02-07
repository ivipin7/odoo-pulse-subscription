import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  base_price: z.number().positive('Price must be positive'),
  billing_period: z.enum(['MONTHLY', 'SEMI_ANNUAL', 'ANNUAL']).default('MONTHLY'),
  category_id: z.number().int().positive(),
  variants: z.array(z.object({
    name: z.string().min(1),
    extra_price: z.number().min(0).default(0),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
