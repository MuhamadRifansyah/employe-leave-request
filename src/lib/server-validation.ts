/**
 * Server-side validation utilities.
 * Mirror client-side Zod schemas for consistent validation.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export function validateLeaveRequest(data: {
  startDate?: string;
  endDate?: string;
  reason?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.startDate) {
    const start = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(start.getTime())) {
      errors.push({ field: "startDate", message: "Invalid start date format" });
    } else if (start < today) {
      errors.push({ field: "startDate", message: "Start date cannot be in the past" });
    }
  }

  if (data.endDate && data.startDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(end.getTime())) {
      errors.push({ field: "endDate", message: "Invalid end date format" });
    } else if (end < start) {
      errors.push({ field: "endDate", message: "End date must be on or after start date" });
    } else {
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 30) {
        errors.push({ field: "endDate", message: "Leave duration cannot exceed 30 days" });
      }
    }
  }

  if (data.reason !== undefined) {
    const trimmed = data.reason.trim();
    if (trimmed.length < 5) errors.push({ field: "reason", message: "Reason must be at least 5 characters" });
    if (trimmed.length > 500) errors.push({ field: "reason", message: "Reason must not exceed 500 characters" });
  }

  return errors;
}

export function validateEmployeeData(
  data: { name?: string; department?: string; position?: string },
  isUpdate = false
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isUpdate) {
    if (!data.name?.trim()) errors.push({ field: "name", message: "Name is required" });
    if (!data.department?.trim()) errors.push({ field: "department", message: "Department is required" });
    if (!data.position?.trim()) errors.push({ field: "position", message: "Position is required" });
  }

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed.length > 0 && trimmed.length < 3) errors.push({ field: "name", message: "Name must be at least 3 characters" });
    if (trimmed.length > 100) errors.push({ field: "name", message: "Name must not exceed 100 characters" });
  }

  if (data.department !== undefined && data.department.trim().length > 100) {
    errors.push({ field: "department", message: "Department must not exceed 100 characters" });
  }

  if (data.position !== undefined && data.position.trim().length > 100) {
    errors.push({ field: "position", message: "Position must not exceed 100 characters" });
  }

  return errors;
}
