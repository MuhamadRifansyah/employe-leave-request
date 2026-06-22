"use client";

import type { LeaveStatus } from "@/types";
import { Check, Clock, X, Ban, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface StatusTimelineProps {
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, { label: string; icon: typeof Check; color: string }> = {
  APPROVED: { label: "Approved", icon: Check, color: "text-emerald-500" },
  REJECTED: { label: "Rejected", icon: X, color: "text-rose-500" },
  CANCELLED: { label: "Cancelled", icon: Ban, color: "text-slate-500" },
};

export function StatusTimeline({ status, createdAt, updatedAt }: StatusTimelineProps) {
  const isResolved = status !== "PENDING";
  const finalConfig = statusLabels[status];

  return (
    <div className="space-y-0">
      {/* Step 1: Submitted */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <Check className="h-3.5 w-3.5" />
          </div>
          <div className={cn("w-0.5 flex-1 my-1", isResolved ? "bg-emerald-500/40" : "bg-border")} />
        </div>
        <div className="pb-5 pt-0.5">
          <p className="text-sm font-medium">Request Submitted</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(createdAt)}</p>
        </div>
      </div>

      {/* Step 2: Under Review */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          {isResolved ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Check className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}
          <div className={cn(
            "w-0.5 flex-1 my-1",
            isResolved
              ? status === "APPROVED" ? "bg-emerald-500/40" : status === "REJECTED" ? "bg-rose-500/40" : "bg-slate-500/40"
              : "bg-border"
          )} />
        </div>
        <div className="pb-5 pt-0.5">
          <p className={cn("text-sm font-medium", !isResolved && "text-primary")}>
            {isResolved ? "Review Completed" : "Under Review"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isResolved ? "Decision has been made" : "Awaiting manager approval"}
          </p>
        </div>
      </div>

      {/* Step 3: Final Status */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          {isResolved && finalConfig ? (
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
              status === "APPROVED" ? "bg-emerald-500" : status === "REJECTED" ? "bg-rose-500" : "bg-slate-500"
            )}>
              <finalConfig.icon className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted">
              <AlertCircle className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="pt-0.5">
          <p className={cn("text-sm font-medium", finalConfig?.color || "text-muted-foreground")}>
            {isResolved && finalConfig ? finalConfig.label : "Pending Decision"}
          </p>
          {isResolved && (
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(updatedAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
