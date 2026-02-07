import { z } from 'zod';

export const createTaxRuleSchema = z.object({
  name: z.string().min(2).max(100),
  region: z.string().min(2).max(50),
  tax_type: z.enum(['GST', 'IGST', 'CGST_SGST', 'VAT', 'SALES_TAX']),
  rate: z.number().min(0).max(100),
  is_active: z.boolean().default(true),
  applicable_categories: z.array(z.string().uuid()).optional(),
});

export const updateTaxRuleSchema = createTaxRuleSchema.partial();

export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
