import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN']).optional(),
  is_active: z.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN']).default('CUSTOMER'),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
