import { z } from 'zod';

/**
 * Zod schemas for payment endpoints
 * Used with validate middleware for request validation
 */

// POST /api/payments/process — process payment for an invoice
export const processPaymentSchema = z.object({
  invoiceId: z.number().int().positive('Invoice ID must be a positive integer'),
  method: z.enum(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING']).optional().default('UPI'),
});

// POST /api/payments/retry/:invoiceId — retry failed payment
export const retryPaymentParamsSchema = z.object({
  invoiceId: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) throw new Error('Invalid invoice ID');
    return num;
  }),
});

// GET /api/payments — list payments (query filters)
export const listPaymentsQuerySchema = z.object({
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'REFUNDED']).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
}).partial();

// GET /api/payments/:id — get single payment
export const paymentIdParamsSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) throw new Error('Invalid payment ID');
    return num;
  }),
});

// GET /api/recovery/timeline — query params
export const timelineQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
}).partial();

// POST /api/payments/demo/force — demo mode control
export const demoForceSchema = z.object({
  result: z.enum(['success', 'failure']),
});

// Type exports for controllers
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type RetryPaymentParams = z.infer<typeof retryPaymentParamsSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
export type DemoForceInput = z.infer<typeof demoForceSchema>;
