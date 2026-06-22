"use client";

import { Card } from "@/components/ui/card";
import { Wallet, AlertTriangle, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_LEAVE_BALANCE } from "@/constants";

interface LowBalanceEmployee {
  id: string;
  name: string;
  department: string;
  leaveBalance: number;
}

interface LeaveBalanceSummaryProps {
  total: number;
  average: number;
  min: number;
  max: number;
  lowBalanceEmployees: LowBalanceEmployee[];
  totalEmployees: number;
}

function BalancePill({
  label,
  value,
  suffix = "days",
  variant = "default",
}: {
  label: string;
  value: number | string;
  suffix?: string;
  variant?: "default" | "warning" | "success";
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-xl font-bold tabular-nums",
          variant === "warning" && "text-amber-500",
          variant === "success" && "text-emerald-500"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{suffix}</p>
    </div>
  );
}

export function LeaveBalanceSummary({
  total,
  average,
  min,
  max,
  lowBalanceEmployees,
  totalEmployees,
}: LeaveBalanceSummaryProps) {
  const usagePercent =
    totalEmployees > 0
      ? Math.round(((totalEmployees * DEFAULT_LEAVE_BALANCE - total) / (totalEmployees * DEFAULT_LEAVE_BALANCE)) * 100)
      : 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Leave Balance</h3>
            <p className="text-[11px] text-muted-foreground">Team allocation overview</p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Team Usage</span>
            <span className="font-semibold tabular-nums">{usagePercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                usagePercent > 75
                  ? "bg-gradient-to-r from-rose-500 to-red-500"
                  : usagePercent > 50
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500"
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 py-4 border-y border-border/30">
          <BalancePill label="Total" value={total} />
          <BalancePill label="Average" value={average} variant="success" />
          <BalancePill label="Min" value={min} variant="warning" />
          <BalancePill label="Max" value={max} />
        </div>

        {/* Low balance employees */}
        {lowBalanceEmployees.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Low Balance ({lowBalanceEmployees.length})
              </span>
            </div>
            <div className="space-y-2">
              {lowBalanceEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 bg-amber-500/5 border border-amber-500/10"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {emp.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendingDown className="h-3 w-3 text-amber-500" />
                    <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {emp.leaveBalance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowBalanceEmployees.length === 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 bg-emerald-500/5 border border-emerald-500/10">
            <Users className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              All employees have healthy leave balance
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
