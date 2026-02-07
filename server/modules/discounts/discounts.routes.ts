import { Router } from 'express';
import { DiscountController } from './discounts.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { createDiscountSchema, updateDiscountSchema, validateDiscountSchema } from './discounts.schema';

const router = Router();

router.get('/', authMiddleware, DiscountController.getAll);
router.post('/', authMiddleware, adminOnly, validate(createDiscountSchema), DiscountController.create);
router.put('/:id', authMiddleware, adminOnly, validate(updateDiscountSchema), DiscountController.update);
router.post('/validate', authMiddleware, validate(validateDiscountSchema), DiscountController.validate);

export default router;
