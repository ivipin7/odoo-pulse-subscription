import { z } from "zod";

export const createInvoiceSchema = z.object({
  subscription_id: z.string().uuid(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "PAID", "FAILED", "CANCELLED"]),
});
