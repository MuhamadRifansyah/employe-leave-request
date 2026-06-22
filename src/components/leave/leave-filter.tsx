"use client";

import type { LeaveStatus } from "@/types";
import { cn } from "@/lib/utils";

interface LeaveFilterProps {
  currentFilter: LeaveStatus | "ALL";
  onFilterChange: (status: LeaveStatus | "ALL") => void;
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
}

const filters: { value: LeaveStatus | "ALL"; label: string; countKey: keyof LeaveFilterProps["counts"]; dotColor?: string }[] = [
  { value: "ALL", label: "All", countKey: "all" },
  { value: "PENDING", label: "Pending", countKey: "pending", dotColor: "bg-amber-500" },
  { value: "APPROVED", label: "Approved", countKey: "approved", dotColor: "bg-emerald-500" },
  { value: "REJECTED", label: "Rejected", countKey: "rejected", dotColor: "bg-rose-500" },
  { value: "CANCELLED", label: "Cancelled", countKey: "cancelled", dotColor: "bg-slate-500" },
];

export function LeaveFilter({ currentFilter, onFilterChange, counts }: LeaveFilterProps) {
  return (
    <div className="inline-flex items-center rounded-xl bg-muted/50 border border-border/50 p-1 gap-0.5">
      {filters.map((f) => {
        const isActive = currentFilter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.dotColor && (
              <span className={cn("h-1.5 w-1.5 rounded-full transition-transform duration-200", f.dotColor, isActive && "scale-125")} />
            )}
            {f.label}
            <span className={cn(
              "ml-0.5 rounded-md px-1.5 py-0 text-[10px] font-semibold tabular-nums transition-colors duration-200",
              isActive ? "bg-primary/10 text-primary" : "bg-transparent text-muted-foreground/60"
            )}>
              {counts[f.countKey]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
