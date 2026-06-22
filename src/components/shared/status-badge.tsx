import type { LeaveStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<LeaveStatus, { label: string; dotColor: string; className: string }> = {
  PENDING: {
    label: "Pending",
    dotColor: "bg-amber-500",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  APPROVED: {
    label: "Approved",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    dotColor: "bg-rose-500",
    className: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  },
  CANCELLED: {
    label: "Cancelled",
    dotColor: "bg-slate-500",
    className: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  },
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        config.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}
