import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { validate } from '../../middleware/validate';
import { processPaymentSchema, demoForceSchema } from './payments.schema';

const router = Router();

/**
 * Payment Routes
 *
 * POST /api/payments/process         — Process payment for an invoice
 * POST /api/payments/retry/:invoiceId — Retry a failed payment (CORE FEATURE)
 * GET  /api/payments                  — List all payments
 * GET  /api/payments/:id              — Get single payment
 * POST /api/payments/demo/force       — Demo: force next result (success/failure)
 */

// Process a new payment
router.post('/process', validate(processPaymentSchema), PaymentController.processPayment);

// Retry a failed payment — THE CORE FEATURE
router.post('/retry/:invoiceId', PaymentController.retryPayment);

// Demo mode: force next payment outcome
router.post('/demo/force', validate(demoForceSchema), PaymentController.demoForceResult);

// List all payments
router.get('/', PaymentController.getAllPayments);

// Get single payment
router.get('/:id', PaymentController.getPaymentById);

export default router;
