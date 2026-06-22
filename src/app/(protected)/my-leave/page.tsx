"use client";

import { PageHeader } from "@/components/shared/page-header";
import { LeaveTable } from "@/components/leave/leave-table";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { LeaveFilter } from "@/components/leave/leave-filter";
import { useAuth } from "@/hooks/use-auth";
import { leaveApi } from "@/services/leave-storage";
import { employeeApi } from "@/services/employee-storage";
import { Button } from "@/components/ui/button";
import { Plus, TableProperties, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { Employee, LeaveRequest, LeaveStatus } from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "calendar";

export default function MyLeavePage() {
  const { session } = useAuth();
  const [allMyLeaves, setAllMyLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find the employee record that maps to the current auth user
  useEffect(() => {
    async function findEmployee() {
      if (!session) return;
      try {
        const result = await employeeApi.getAll({ pageSize: 1000 });
        const allEmployees = result.data;
        setEmployees(allEmployees);
        const match = allEmployees.find(
          (e) =>
            e.name.toLowerCase() === session.displayName.toLowerCase() ||
            e.name.toLowerCase() === session.username.toLowerCase()
        );
        setMyEmployeeId(match?.id ?? null);
      } catch (err) {
        console.error("Failed to find employee:", err);
        toast.error("Failed to load employee data");
      } finally {
        setIsLoading(false);
      }
    }
    findEmployee();
  }, [session]);

  const refresh = useCallback(async () => {
    if (!myEmployeeId) {
      setAllMyLeaves([]);
      setIsLoading(false);
      return;
    }
    try {
      const leaves = await leaveApi.getByEmployeeId(myEmployeeId);
      setAllMyLeaves(leaves);
    } catch (err) {
      console.error("Failed to fetch leave requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [myEmployeeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredLeaves = useMemo(() => {
    if (statusFilter === "ALL") return allMyLeaves;
    return allMyLeaves.filter((r) => r.status === statusFilter);
  }, [allMyLeaves, statusFilter]);

  const pendingCount = allMyLeaves.filter((r) => r.status === "PENDING").length;
  const approvedCount = allMyLeaves.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = allMyLeaves.filter((r) => r.status === "REJECTED").length;
  const cancelledCount = allMyLeaves.filter((r) => r.status === "CANCELLED").length;

  const handleCancel = async (id: string) => {
    try {
      await leaveApi.updateStatus(id, "CANCELLED");
      toast.success("Leave request cancelled");
      await refresh();
    } catch (err) {
      toast.error("Failed to cancel request", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await leaveApi.delete(id);
      toast.success("Leave request deleted");
      await refresh();
    } catch (err) {
      toast.error("Failed to delete request", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const noop = () => {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="My Leave"
          subtitle="View and manage your leave requests"
          actionLabel="New Request"
          actionHref="/my-leave/new"
          actionIcon={Plus}
        />
      </div>

      {/* View Toggle + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <LeaveFilter
          currentFilter={statusFilter}
          onFilterChange={setStatusFilter}
          counts={{
            all: allMyLeaves.length,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            cancelled: cancelledCount,
          }}
        />
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 border border-border/50 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8 rounded-lg gap-1.5 text-xs font-medium transition-all duration-200",
              viewMode === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TableProperties className="h-3.5 w-3.5" />
            Table
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("calendar")}
            className={cn(
              "h-8 rounded-lg gap-1.5 text-xs font-medium transition-all duration-200",
              viewMode === "calendar"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Content */}
      {!myEmployeeId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold">No employee profile linked</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Your account is not linked to an employee profile. Contact your administrator to set up your profile.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <LeaveTable
          leaveRequests={filteredLeaves}
          employees={employees}
          onApprove={noop}
          onReject={noop}
          onDelete={handleDelete}
          onCancel={handleCancel}
          canApproveReject={false}
          editBasePath="/leave/edit"
        />
      ) : (
        <LeaveCalendar
          leaveRequests={allMyLeaves}
          employees={employees}
        />
      )}
    </div>
  );
}
