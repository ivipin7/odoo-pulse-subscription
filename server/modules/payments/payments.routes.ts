import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { processPaymentSchema, retryPaymentSchema } from './payments.schema';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Process a new payment
router.post('/process', validate(processPaymentSchema), paymentsController.processPayment);

// Retry a failed payment (admin only)
router.post('/retry/:invoiceId', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), validate(retryPaymentSchema), paymentsController.retryPayment);

// Get all payments (role-aware: customer sees own, admin sees all)
router.get('/', paymentsController.getAll);

// Get payment by ID
router.get('/:id', paymentsController.getById);

// Get payments for a specific invoice
router.get('/invoice/:invoiceId', paymentsController.getByInvoice);

// Get retry history for an invoice
router.get('/retries/:invoiceId', paymentsController.getRetryHistory);

// ── Recovery Dashboard (Admin only) ──────────────────────────────

router.get('/recovery/dashboard', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), paymentsController.getRecoveryDashboard);
router.get('/recovery/at-risk', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), paymentsController.getAtRiskSubscriptions);
router.get('/recovery/timeline', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), paymentsController.getRecoveryTimeline);

export default router;
