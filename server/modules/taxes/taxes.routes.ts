import { Router } from 'express';
import { TaxController } from './taxes.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { createTaxSchema, updateTaxSchema } from './taxes.schema';

const router = Router();

router.get('/', authMiddleware, TaxController.getAll);
router.post('/', authMiddleware, adminOnly, validate(createTaxSchema), TaxController.create);
router.put('/:id', authMiddleware, adminOnly, validate(updateTaxSchema), TaxController.update);

export default router;
