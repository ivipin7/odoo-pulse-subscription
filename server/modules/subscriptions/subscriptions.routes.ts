import { Router } from 'express';
import { SubscriptionController } from './subscriptions.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { createSubscriptionSchema, updateStatusSchema } from './subscriptions.schema';

const router = Router();

router.get('/', authMiddleware, SubscriptionController.getAll);
router.get('/:id', authMiddleware, SubscriptionController.getById);
router.post('/', authMiddleware, validate(createSubscriptionSchema), SubscriptionController.create);
router.patch('/:id/status', authMiddleware, validate(updateStatusSchema), SubscriptionController.updateStatus);

export default router;
