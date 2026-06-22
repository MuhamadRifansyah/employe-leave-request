import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    employeeId: z.string().min(1, "Employee is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z
      .string()
      .trim()
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason must not exceed 500 characters"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    { message: "Start date cannot be in the past", path: ["startDate"] }
  )
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: "End date must be on or after start date", path: ["endDate"] }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      return diffDays <= 30;
    },
    { message: "Leave duration cannot exceed 30 days", path: ["endDate"] }
  );

export const leaveEditSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z
      .string()
      .trim()
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason must not exceed 500 characters"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    { message: "Start date cannot be in the past", path: ["startDate"] }
  )
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: "End date must be on or after start date", path: ["endDate"] }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      return diffDays <= 30;
    },
    { message: "Leave duration cannot exceed 30 days", path: ["endDate"] }
  );

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
export type LeaveEditFormData = z.infer<typeof leaveEditSchema>;
