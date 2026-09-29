import { z } from "zod";
export const registerSchema = z.object({ fullName: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), password: z.string().min(8).max(72), confirmPassword: z.string(), branch: z.string().trim().min(1).max(100), year: z.coerce.number().int().min(1).max(8) }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(72) });
