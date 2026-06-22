export const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type LeaveStatus = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];

export type LeaveRequest = {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
};
