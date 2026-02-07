import { Router } from 'express';
import { quotationsController } from './quotations.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createQuotationSchema, updateQuotationStatusSchema } from './quotations.schema';

const router = Router();

router.use(authenticate);

router.get('/', quotationsController.getAll);
router.get('/:id', quotationsController.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), validate(createQuotationSchema), quotationsController.create);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), validate(updateQuotationStatusSchema), quotationsController.updateStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), quotationsController.remove);

export default router;
