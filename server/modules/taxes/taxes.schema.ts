import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().min(2),
  rate: z.number().min(0).max(100),
  type: z.enum(['GST', 'IGST', 'CGST_SGST', 'CESS']),
  applicable_to: z.string().min(1),
  region: z.string().min(1),
});

export const updateTaxSchema = createTaxSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
