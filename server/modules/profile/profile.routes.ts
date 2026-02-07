import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { updateProfileSchema, createAddressSchema, updateAddressSchema } from './profile.schema';

const router = Router();

router.get('/', authMiddleware, ProfileController.getProfile);
router.put('/', authMiddleware, validate(updateProfileSchema), ProfileController.updateProfile);
router.get('/addresses', authMiddleware, ProfileController.getAddresses);
router.post('/addresses', authMiddleware, validate(createAddressSchema), ProfileController.addAddress);
router.put('/addresses/:id', authMiddleware, validate(updateAddressSchema), ProfileController.updateAddress);
router.delete('/addresses/:id', authMiddleware, ProfileController.deleteAddress);

export default router;
