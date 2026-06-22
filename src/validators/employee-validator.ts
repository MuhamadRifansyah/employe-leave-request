import { z } from "zod";

export const employeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'.,-]+$/, "Name can only contain letters, spaces, and common punctuation"),
  department: z
    .string()
    .trim()
    .min(1, "Department is required")
    .max(100, "Department must not exceed 100 characters"),
  position: z
    .string()
    .trim()
    .min(1, "Position is required")
    .max(100, "Position must not exceed 100 characters"),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
