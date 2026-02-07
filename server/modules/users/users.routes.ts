import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateUserSchema } from './users.schema';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.get('/', usersController.getAll);
router.get('/stats', usersController.getStats);
router.get('/:id', usersController.getById);
router.put('/:id', validate(updateUserSchema), usersController.update);
router.delete('/:id', usersController.remove);

export default router;
