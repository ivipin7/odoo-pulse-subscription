import { Router } from 'express';
import { OrderController } from './orders.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { createOrderSchema } from './orders.schema';

const router = Router();

router.get('/', authMiddleware, OrderController.getAll);
router.get('/:id', authMiddleware, OrderController.getById);
router.post('/', authMiddleware, validate(createOrderSchema), OrderController.create);

export default router;
