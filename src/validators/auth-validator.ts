import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or less"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password must be 100 characters or less"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
