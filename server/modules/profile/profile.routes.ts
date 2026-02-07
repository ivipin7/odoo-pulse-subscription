import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from './profile.schema';

const router = Router();

router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), profileController.changePassword);

export default router;
