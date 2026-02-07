import { Router } from 'express';
import { cartController } from './cart.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from './cart.schema';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validate(addToCartSchema), cartController.addToCart);
router.patch('/:itemId', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
