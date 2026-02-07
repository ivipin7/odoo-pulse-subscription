import { Router } from 'express';
import { CartController } from './cart.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { addCartItemSchema, updateCartItemSchema } from './cart.schema';

const router = Router();

router.get('/', authMiddleware, CartController.getCart);
router.post('/', authMiddleware, validate(addCartItemSchema), CartController.addItem);
router.put('/:id', authMiddleware, validate(updateCartItemSchema), CartController.updateItem);
router.delete('/:id', authMiddleware, CartController.removeItem);

export default router;
