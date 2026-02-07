import { Router } from 'express';
import { taxesController } from './taxes.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createTaxRuleSchema, updateTaxRuleSchema } from './taxes.schema';

const router = Router();

router.use(authenticate);

// Calculate tax (any authenticated user)
router.get('/calculate', taxesController.calculate);

router.get('/', taxesController.getAll);
router.get('/:id', taxesController.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), validate(createTaxRuleSchema), taxesController.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), validate(updateTaxRuleSchema), taxesController.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), taxesController.remove);

export default router;
