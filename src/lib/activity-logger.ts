import { prisma } from "@/lib/prisma";

export type ActivityCategory = "AUTH" | "EMPLOYEE" | "LEAVE";

export type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "EMPLOYEE_DELETED"
  | "LEAVE_CREATED"
  | "LEAVE_UPDATED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_CANCELLED"
  | "LEAVE_DELETED";

interface LogParams {
  action: ActivityAction;
  category: ActivityCategory;
  description: string;
  userId?: string;
  userName?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: params.action,
        category: params.category,
        description: params.description,
        userId: params.userId ?? null,
        userName: params.userName ?? null,
        targetId: params.targetId ?? null,
        targetName: params.targetName ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export const ActivityLogger = {
  auth: {
    login(userId: string, userName: string, ip?: string) {
      return logActivity({ action: "LOGIN", category: "AUTH", description: `${userName} logged in`, userId, userName, ipAddress: ip });
    },
    logout(userId: string, userName: string) {
      return logActivity({ action: "LOGOUT", category: "AUTH", description: `${userName} logged out`, userId, userName });
    },
  },
  employee: {
    created(empName: string, empId: string, byUser?: string) {
      return logActivity({ action: "EMPLOYEE_CREATED", category: "EMPLOYEE", description: `Employee "${empName}" was added`, userName: byUser, targetId: empId, targetName: empName });
    },
    updated(empName: string, empId: string, changes: Record<string, unknown>, byUser?: string) {
      return logActivity({ action: "EMPLOYEE_UPDATED", category: "EMPLOYEE", description: `Employee "${empName}" was updated`, userName: byUser, targetId: empId, targetName: empName, metadata: changes });
    },
    deleted(empName: string, empId: string, byUser?: string) {
      return logActivity({ action: "EMPLOYEE_DELETED", category: "EMPLOYEE", description: `Employee "${empName}" was deleted`, userName: byUser, targetId: empId, targetName: empName });
    },
  },
  leave: {
    created(employeeName: string, leaveId: string, startDate: string, endDate: string, byUser?: string) {
      return logActivity({ action: "LEAVE_CREATED", category: "LEAVE", description: `Leave request by ${employeeName} (${startDate} to ${endDate})`, userName: byUser, targetId: leaveId, targetName: employeeName, metadata: { startDate, endDate } });
    },
    approved(employeeName: string, leaveId: string, byUser?: string) {
      return logActivity({ action: "LEAVE_APPROVED", category: "LEAVE", description: `Leave request by ${employeeName} was approved`, userName: byUser, targetId: leaveId, targetName: employeeName });
    },
    rejected(employeeName: string, leaveId: string, byUser?: string) {
      return logActivity({ action: "LEAVE_REJECTED", category: "LEAVE", description: `Leave request by ${employeeName} was rejected`, userName: byUser, targetId: leaveId, targetName: employeeName });
    },
    cancelled(employeeName: string, leaveId: string, byUser?: string) {
      return logActivity({ action: "LEAVE_CANCELLED", category: "LEAVE", description: `Leave request by ${employeeName} was cancelled`, userName: byUser, targetId: leaveId, targetName: employeeName });
    },
    deleted(leaveId: string, byUser?: string) {
      return logActivity({ action: "LEAVE_DELETED", category: "LEAVE", description: `Leave request was deleted`, userName: byUser, targetId: leaveId });
    },
  },
};
