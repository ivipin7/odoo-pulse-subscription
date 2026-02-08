import { z } from "zod";

const optionalUuid = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().uuid().nullable().optional()
);

export const createSubscriptionSchema = z.object({
  customer_id: z.string().uuid(),
  recurring_plan_id: optionalUuid,
  quotation_template_id: optionalUuid,
  start_date: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
  expiration_date: z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional()),
  payment_terms: z.enum(["IMMEDIATE", "NET_15", "NET_30", "NET_60"]).default("IMMEDIATE"),
  notes: z.string().optional(),
  lines: z.array(z.object({
    product_id: z.string().uuid(),
    description: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
    unit_price: z.number().min(0),
    discount_id: optionalUuid,
    tax_id: optionalUuid,
  })).optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED", "PAUSED", "CANCELLED"]),
  cancellation_reason: z.string().min(1).max(1000).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
