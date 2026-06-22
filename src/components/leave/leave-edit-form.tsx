"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveEditSchema, type LeaveEditFormData } from "@/validators/leave-validator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StatusTimeline } from "@/components/leave/status-timeline";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { LeaveRequest } from "@/types";
import { Loader2, ArrowLeft, User, Building2, Ban } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { calculateDuration } from "@/lib/utils";

interface LeaveEditFormProps {
  request: LeaveRequest;
  employeeName: string;
  employeeDepartment: string;
  leaveBalance: number;
  onSubmit: (data: LeaveEditFormData) => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  backHref: string;
  canEdit: boolean;
  canCancel: boolean;
}

export function LeaveEditForm({
  request,
  employeeName,
  employeeDepartment,
  leaveBalance,
  onSubmit,
  onCancel,
  backHref,
  canEdit,
  canCancel,
}: LeaveEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<LeaveEditFormData>({
    resolver: zodResolver(leaveEditSchema),
    defaultValues: {
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
    },
  });

  const watchStart = watch("startDate");
  const watchEnd = watch("endDate");
  const duration = watchStart && watchEnd ? calculateDuration(watchStart, watchEnd) : 0;

  const handleFormSubmit = async (data: LeaveEditFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main form */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {canEdit ? "Edit Leave Request" : "Leave Request Details"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {canEdit ? "Update the leave request details below." : "View the details of this leave request."}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {/* Employee info (read-only) */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 mb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{employeeName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {employeeDepartment}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Leave Balance</p>
              <p className="text-lg font-bold tabular-nums text-primary">{leaveBalance}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  disabled={!canEdit}
                  {...register("startDate")}
                  className={cn(
                    "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                    errors.startDate && "border-destructive"
                  )}
                />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  disabled={!canEdit}
                  {...register("endDate")}
                  className={cn(
                    "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                    errors.endDate && "border-destructive"
                  )}
                />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Duration indicator */}
            {duration > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                  duration > leaveBalance ? "bg-rose-500/10 text-rose-600" : "bg-primary/10 text-primary"
                )}>
                  {duration} {duration === 1 ? "day" : "days"}
                </span>
                {duration > leaveBalance && (
                  <span className="text-xs text-rose-500">Exceeds available balance</span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for leave..."
                rows={4}
                disabled={!canEdit}
                {...register("reason")}
                className={cn(
                  "rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors resize-none",
                  errors.reason && "border-destructive"
                )}
              />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border/30">
              <Link
                href={backHref}
                className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              {canEdit && (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
              {canCancel && (
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  }
                  title="Cancel Leave Request"
                  description="Are you sure you want to cancel this leave request? This action cannot be undone."
                  confirmLabel="Yes, Cancel It"
                  variant="destructive"
                  onConfirm={onCancel}
                />
              )}
            </div>
          </form>
        </div>
      </Card>

      {/* Timeline sidebar */}
      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
          <h3 className="text-sm font-semibold tracking-tight mb-4">Status Timeline</h3>
          <StatusTimeline
            status={request.status}
            createdAt={request.createdAt}
            updatedAt={request.updatedAt}
          />
        </Card>
      </div>
    </div>
  );
}
