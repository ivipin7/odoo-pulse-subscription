import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  gst_number: z.string().max(15).optional(),
  avatar_url: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
