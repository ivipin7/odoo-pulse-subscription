import { z } from "zod";

export const createTaxSchema = z.object({
  name: z.string().min(1, "Tax name is required"),
  tax_computation: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
});

export const updateTaxSchema = createTaxSchema.partial();
export type CreateTaxInput = z.infer<typeof createTaxSchema>;
