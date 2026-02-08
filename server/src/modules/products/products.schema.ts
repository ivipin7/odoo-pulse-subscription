import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name required"),
  product_type: z.enum(["SERVICE", "CONSUMABLE"]).default("SERVICE"),
  description: z.string().optional(),
  sales_price: z.number().min(0).default(0),
  cost_price: z.number().min(0).default(0),
  tax_id: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().uuid().nullable().optional()
  ),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
