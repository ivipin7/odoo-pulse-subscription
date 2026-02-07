import { Router } from 'express';
import { InvoiceController } from './invoices.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { createInvoiceSchema, updateInvoiceStatusSchema } from './invoices.schema';

const router = Router();

router.get('/', authMiddleware, InvoiceController.getAll);
router.get('/:id', authMiddleware, InvoiceController.getById);
router.post('/', authMiddleware, validate(createInvoiceSchema), InvoiceController.create);
router.patch('/:id/status', authMiddleware, validate(updateInvoiceStatusSchema), InvoiceController.updateStatus);

export default router;
