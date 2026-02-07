import { z } from 'zod';

export const updateUserSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'CUSTOMER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  department: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
