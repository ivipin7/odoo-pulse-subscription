import { Router } from 'express';
import { ProductController } from './products.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router();

// Public routes
router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getById);

// Admin-only routes
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createProductSchema), ProductController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ProductController.remove);

export { router as productRoutes };
