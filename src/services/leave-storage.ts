import type { LeaveRequest, LeaveStatus } from "@/types/leave-request";
import { fetchJson } from "@/lib/api-client";

const BASE_URL = "/api/leave";

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: {
    name: string;
    department: string;
    leaveBalance: number;
  };
};

export const leaveApi = {
  async getAll(): Promise<LeaveRequest[]> {
    const { data } = await fetchJson<{ data: LeaveRequest[] }>(BASE_URL);
    return data;
  },

  async getById(id: string): Promise<LeaveRequestWithEmployee | undefined> {
    try {
      const { data } = await fetchJson<{ data: LeaveRequestWithEmployee }>(
        `${BASE_URL}/${id}`
      );
      return data;
    } catch {
      return undefined;
    }
  },

  async create(data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    const { data: created } = await fetchJson<{ data: LeaveRequest }>(
      BASE_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return created;
  },

  async updateStatus(id: string, status: LeaveStatus, rejectionReason?: string): Promise<LeaveRequest> {
    const { data: updated } = await fetchJson<{ data: LeaveRequest }>(
      `${BASE_URL}/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(rejectionReason && { rejectionReason }) }),
      }
    );
    return updated;
  },

  async updateFields(
    id: string,
    fields: { startDate?: string; endDate?: string; reason?: string }
  ): Promise<LeaveRequest> {
    const { data: updated } = await fetchJson<{ data: LeaveRequest }>(
      `${BASE_URL}/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      }
    );
    return updated;
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, { method: "DELETE" });
  },

  async getByStatus(status: LeaveStatus): Promise<LeaveRequest[]> {
    const { data } = await fetchJson<{ data: LeaveRequest[] }>(
      `${BASE_URL}?status=${status}`
    );
    return data;
  },

  async getByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    const { data } = await fetchJson<{ data: LeaveRequest[] }>(
      `${BASE_URL}?employeeId=${employeeId}`
    );
    return data;
  },
};
