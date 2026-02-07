import { Router } from 'express';
import { discountsController } from './discounts.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createDiscountSchema, updateDiscountSchema } from './discounts.schema';

const router = Router();

router.use(authenticate);

// Validate a discount code (any authenticated user)
router.get('/validate', discountsController.validate);

router.get('/', discountsController.getAll);
router.get('/:id', discountsController.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), validate(createDiscountSchema), discountsController.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), validate(updateDiscountSchema), discountsController.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), discountsController.remove);

export default router;
