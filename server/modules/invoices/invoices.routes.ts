import { Router } from 'express';
import { InvoiceController } from './invoices.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createInvoiceSchema, updateInvoiceStatusSchema } from './invoices.schema';

const router = Router();

router.get('/', authenticate, InvoiceController.getAll);
router.get('/:id', authenticate, InvoiceController.getById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MANAGER'), validate(createInvoiceSchema), InvoiceController.create);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'MANAGER'), validate(updateInvoiceStatusSchema), InvoiceController.updateStatus);

export { router as invoiceRoutes };
