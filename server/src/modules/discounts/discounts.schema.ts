import { z } from "zod";

export const createDiscountSchema = z.object({
  name: z.string().min(1),
  discount_type: z.enum(["FIXED", "PERCENTAGE"]).default("PERCENTAGE"),
  value: z.number().min(0),
  min_purchase: z.number().min(0).default(0),
  min_quantity: z.number().int().min(0).default(0),
  start_date: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
  end_date: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
  limit_usage: z.preprocess((v) => (v === "" || v === 0 ? null : v), z.number().int().min(1).nullable().optional()),
  applies_to: z.enum(["ALL", "PRODUCTS", "SUBSCRIPTIONS"]).default("ALL"),
});

export const updateDiscountSchema = createDiscountSchema.partial();
export const validateDiscountSchema = z.object({
  discountId: z.string().uuid(),
  subtotal: z.number().min(0),
  quantity: z.number().int().min(1),
});

export const applyCodeSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
  quantity: z.number().int().min(1),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
