import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schema';

const router = Router();

router.use(authenticate);

router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);
router.post('/', validate(createOrderSchema), ordersController.create);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), validate(updateOrderStatusSchema), ordersController.updateStatus);

export default router;
