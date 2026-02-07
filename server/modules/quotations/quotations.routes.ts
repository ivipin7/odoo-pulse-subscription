import { Router } from 'express';
import { QuotationController } from './quotations.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { createQuotationSchema, updateQuotationStatusSchema } from './quotations.schema';

const router = Router();

router.get('/', authMiddleware, QuotationController.getAll);
router.get('/:id', authMiddleware, QuotationController.getById);
router.post('/', authMiddleware, validate(createQuotationSchema), QuotationController.create);
router.patch('/:id/status', authMiddleware, adminOnly, validate(updateQuotationStatusSchema), QuotationController.updateStatus);

export default router;
