import { Router } from 'express';
import { ProductController } from './products.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', authMiddleware, adminOnly, validate(createProductSchema), ProductController.create);
router.put('/:id', authMiddleware, adminOnly, validate(updateProductSchema), ProductController.update);
router.delete('/:id', authMiddleware, adminOnly, ProductController.remove);

export default router;
