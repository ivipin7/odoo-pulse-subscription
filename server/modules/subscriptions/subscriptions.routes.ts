import { Router } from 'express';
import { SubscriptionController } from './subscriptions.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createSubscriptionSchema, updateStatusSchema } from './subscriptions.schema';

const router = Router();

router.get('/', authenticate, SubscriptionController.getAll);
router.get('/:id', authenticate, SubscriptionController.getById);
router.post('/', authenticate, validate(createSubscriptionSchema), SubscriptionController.create);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MANAGER'), validate(updateStatusSchema), SubscriptionController.updateStatus);

export { router as subscriptionRoutes };
