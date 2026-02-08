import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(passwordRegex, "Password must be 8+ chars with uppercase, lowercase, and special character"),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["ADMIN", "INTERNAL", "PORTAL"]).default("PORTAL"),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });
