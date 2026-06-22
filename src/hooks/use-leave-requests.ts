"use client";

import { useState, useCallback, useEffect } from "react";
import { leaveApi } from "@/services/leave-storage";
import type { LeaveRequest, LeaveStatus } from "@/types";
import { toast } from "sonner";

export function useLeaveRequests(employeeId?: string) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      let all: LeaveRequest[];
      if (employeeId) {
        all = await leaveApi.getByEmployeeId(employeeId);
      } else {
        all = await leaveApi.getAll();
      }
      setAllLeaveRequests(all);

      // Compute counts from the full list
      setPendingCount(all.filter((r) => r.status === "PENDING").length);
      setApprovedCount(all.filter((r) => r.status === "APPROVED").length);
      setRejectedCount(all.filter((r) => r.status === "REJECTED").length);
      setCancelledCount(all.filter((r) => r.status === "CANCELLED").length);

      return all;
    } catch (err) {
      console.error("Failed to fetch leave requests:", err);
      toast.error("Failed to load leave requests");
      return [];
    }
  }, [employeeId]);

  const refresh = useCallback(async () => {
    const all = await fetchAll();
    if (statusFilter === "ALL") {
      setLeaveRequests(all);
    } else {
      setLeaveRequests(all.filter((r) => r.status === statusFilter));
    }
  }, [fetchAll, statusFilter]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const addLeaveRequest = useCallback(
    async (data: { employeeId: string; startDate: string; endDate: string; reason: string }) => {
      const created = await leaveApi.create(data);
      toast.success("Leave request submitted", {
        description: "The request is now pending approval.",
      });
      await refresh();
      return created;
    },
    [refresh]
  );

  const approveRequest = useCallback(
    async (id: string) => {
      try {
        await leaveApi.updateStatus(id, "APPROVED");
        toast.success("Leave request approved", {
          description: "Leave balance has been deducted.",
        });
        await refresh();
      } catch (err) {
        toast.error("Failed to approve", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    },
    [refresh]
  );

  const rejectRequest = useCallback(
    async (id: string) => {
      try {
        await leaveApi.updateStatus(id, "REJECTED");
        toast.success("Leave request rejected");
        await refresh();
      } catch (err) {
        toast.error("Failed to reject", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    },
    [refresh]
  );

  const cancelRequest = useCallback(
    async (id: string) => {
      try {
        await leaveApi.updateStatus(id, "CANCELLED");
        toast.success("Leave request cancelled");
        await refresh();
      } catch (err) {
        toast.error("Failed to cancel", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    },
    [refresh]
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      try {
        await leaveApi.delete(id);
        toast.success("Leave request deleted");
        await refresh();
      } catch (err) {
        toast.error("Failed to delete", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    },
    [refresh]
  );

  const filterByStatus = useCallback(
    (status: LeaveStatus | "ALL") => {
      setStatusFilter(status);
      if (status === "ALL") {
        setLeaveRequests(allLeaveRequests);
      } else {
        setLeaveRequests(allLeaveRequests.filter((r) => r.status === status));
      }
    },
    [allLeaveRequests]
  );

  return {
    leaveRequests,
    allLeaveRequests,
    statusFilter,
    isLoading,
    addLeaveRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    deleteRequest,
    filterByStatus,
    refresh,
    pendingCount,
    approvedCount,
    rejectedCount,
    cancelledCount,
  };
}
