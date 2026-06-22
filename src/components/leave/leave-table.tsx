"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { LeaveRequest, Employee } from "@/types";
import { CalendarDays, Check, X, Trash2, Pencil, Ban, Eye } from "lucide-react";
import { formatDate, calculateDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { useMemo } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface LeaveTableProps {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onCancel?: (id: string) => void;
  canApproveReject?: boolean;
  editBasePath?: string;
}

export function LeaveTable({
  leaveRequests,
  employees,
  onApprove,
  onReject,
  onDelete,
  onCancel,
  canApproveReject = true,
  editBasePath = "/leave/edit",
}: LeaveTableProps) {
  const employeeMap = useMemo(() => {
    return employees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {} as Record<string, Employee>);
  }, [employees]);

  if (leaveRequests.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No leave requests"
        description="No leave requests match the current filter. Try changing the filter or create a new request."
        actionLabel="New Request"
        actionHref="/leave/new"
      />
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[200px]">Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="max-w-[200px]">Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveRequests.map((request, idx) => {
            const emp = employeeMap[request.employeeId];
            const empName = emp?.name || "Unknown";
            const isPending = request.status === "PENDING";
            return (
              <TableRow
                key={request.id}
                className="group border-border/30 hover:bg-accent/30 transition-colors duration-150"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-[10px] font-bold shadow-sm",
                      getAvatarColor(empName)
                    )}>
                      {getInitials(empName)}
                    </div>
                    <span className="font-medium text-sm">{empName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span>{formatDate(request.startDate)}</span>
                    <span className="text-muted-foreground mx-1.5">→</span>
                    <span>{formatDate(request.endDate)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium tabular-nums">
                    {calculateDuration(request.startDate, request.endDate)}d
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm text-muted-foreground truncate">{request.reason}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {/* Approve / Reject — only for PENDING, only if role allows */}
                    {isPending && canApproveReject && (
                      <>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title="Approve Leave"
                          description={`Approve ${empName}'s leave request for ${calculateDuration(request.startDate, request.endDate)} day(s)? This will deduct from their leave balance.`}
                          confirmLabel="Approve"
                          variant="default"
                          onConfirm={() => onApprove(request.id)}
                        />
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title="Reject Leave"
                          description={`Reject ${empName}'s leave request?`}
                          confirmLabel="Reject"
                          variant="destructive"
                          onConfirm={() => onReject(request.id)}
                        />
                      </>
                    )}

                    {/* Cancel — only for PENDING, only if handler is provided */}
                    {isPending && onCancel && !canApproveReject && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-500/10"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Cancel Leave Request"
                        description="Are you sure you want to cancel this leave request?"
                        confirmLabel="Cancel Request"
                        variant="destructive"
                        onConfirm={() => onCancel(request.id)}
                      />
                    )}

                    {/* Edit/View — always visible on hover */}
                    <Link
                      href={`${editBasePath}/${request.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-7 w-7 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      )}
                    >
                      {isPending ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Link>

                    {/* Delete — admin only, always on hover */}
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete leave request"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Delete Leave Request"
                      description={`Permanently delete ${empName}'s leave request? This action cannot be undone.`}
                      confirmLabel="Delete"
                      variant="destructive"
                      onConfirm={() => onDelete(request.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {leaveRequests.length} {leaveRequests.length === 1 ? "request" : "requests"}
        </span>
      </div>
    </Card>
  );
}
