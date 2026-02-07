import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { processPaymentSchema } from './payments.schema';

const router = Router();

router.get('/', authMiddleware, PaymentController.getAll);
router.get('/:id', authMiddleware, PaymentController.getById);
router.post('/process', authMiddleware, validate(processPaymentSchema), PaymentController.process);
router.post('/retry/:invoiceId', authMiddleware, adminOnly, PaymentController.retry);

// Recovery endpoints
router.get('/recovery/dashboard', authMiddleware, adminOnly, PaymentController.dashboard);
router.get('/recovery/at-risk', authMiddleware, adminOnly, PaymentController.atRisk);
router.get('/recovery/timeline', authMiddleware, adminOnly, PaymentController.timeline);

export default router;
