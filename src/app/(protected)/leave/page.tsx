"use client";

import { PageHeader } from "@/components/shared/page-header";
import { LeaveTable } from "@/components/leave/leave-table";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { LeaveFilter } from "@/components/leave/leave-filter";
import { useLeaveRequests } from "@/hooks/use-leave-requests";
import { useAuth } from "@/hooks/use-auth";
import { employeeApi } from "@/services/employee-storage";
import { Button } from "@/components/ui/button";
import { Plus, TableProperties, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import type { Employee } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "table" | "calendar";

export default function LeavePage() {
  const {
    leaveRequests,
    allLeaveRequests,
    statusFilter,
    filterByStatus,
    approveRequest,
    rejectRequest,
    cancelRequest,
    deleteRequest,
    pendingCount,
    approvedCount,
    rejectedCount,
    cancelledCount,
    isLoading,
  } = useLeaveRequests();

  const { isAdmin, isManager } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const canApproveReject = isAdmin || isManager;

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const result = await employeeApi.getAll({ pageSize: 1000 });
        setEmployees(result.data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        toast.error("Failed to load employees");
      }
    }
    fetchEmployees();
  }, []);

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
          title="Leave Requests"
          subtitle="Manage employee leave requests"
          actionLabel="New Request"
          actionHref="/leave/new"
          actionIcon={Plus}
        />
      </div>

      {/* View Toggle + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <LeaveFilter
          currentFilter={statusFilter}
          onFilterChange={filterByStatus}
          counts={{
            all: allLeaveRequests.length,
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
      {viewMode === "table" ? (
        <LeaveTable
          leaveRequests={leaveRequests}
          employees={employees}
          onApprove={approveRequest}
          onReject={rejectRequest}
          onDelete={deleteRequest}
          onCancel={cancelRequest}
          canApproveReject={canApproveReject}
          canDelete={isAdmin}
        />
      ) : (
        <LeaveCalendar
          leaveRequests={allLeaveRequests}
          employees={employees}
        />
      )}
    </div>
  );
}
