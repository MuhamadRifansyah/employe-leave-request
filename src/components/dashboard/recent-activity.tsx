"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, timeAgo } from "@/lib/utils";
import { useMemo } from "react";
import { CalendarDays, UserPlus, Clock } from "lucide-react";
import type { LeaveRequest } from "@/types";

interface RecentLeave {
  id: string;
  startDate: string;
  endDate: string;
  status: LeaveRequest["status"];
  createdAt: string;
  updatedAt: string;
  employee?: { name: string; department?: string };
}

interface RecentEmployee {
  id: string;
  name: string;
  department: string;
  position: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: "leave" | "employee";
  title: string;
  description: string;
  time: string;
  status?: LeaveRequest["status"];
}

export interface RecentActivityProps {
  recentLeaves?: RecentLeave[];
  recentEmployees?: RecentEmployee[];
  isLoading?: boolean;
}

const statusActionMap: Record<string, string> = {
  PENDING: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export function RecentActivity({ recentLeaves, recentEmployees, isLoading }: RecentActivityProps) {
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    if (recentLeaves) {
      for (const leave of recentLeaves) {
        const actionLabel = statusActionMap[leave.status] || "updated";
        items.push({
          id: leave.id,
          type: "leave",
          title: `Leave request ${actionLabel}`,
          description: `${leave.employee?.name || "Unknown"} — ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`,
          time: leave.updatedAt || leave.createdAt,
          status: leave.status,
        });
      }
    }

    if (recentEmployees) {
      for (const emp of recentEmployees) {
        items.push({
          id: emp.id,
          type: "employee",
          title: "New employee added",
          description: `${emp.name} — ${emp.department}, ${emp.position}`,
          time: emp.createdAt,
        });
      }
    }

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return items.slice(0, 8);
  }, [recentLeaves, recentEmployees]);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Latest updates from your team</p>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Latest updates from your team</p>
      </div>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No activity yet. Start by adding employees and leave requests.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, idx) => (
            <div
              key={activity.id + idx}
              className="flex items-start gap-3 rounded-xl p-3 hover:bg-accent/50 transition-colors duration-200"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                {activity.type === "leave" ? (
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  {activity.status && <StatusBadge status={activity.status} />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums mt-1">
                {timeAgo(activity.time)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
