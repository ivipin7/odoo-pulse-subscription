import { Router } from 'express';
import { UserController } from './users.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { updateUserSchema } from './users.schema';

const router = Router();

router.get('/', authMiddleware, adminOnly, UserController.getAll);
router.get('/:id', authMiddleware, adminOnly, UserController.getById);
router.patch('/:id', authMiddleware, adminOnly, validate(updateUserSchema), UserController.update);

export default router;
