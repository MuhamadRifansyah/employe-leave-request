"use client";

import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import {
  Search,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  Pencil,
  CalendarPlus,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  ClipboardList,
  Filter,
  Clock,
  RefreshCw,
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */

interface ActivityLog {
  id: string;
  action: string;
  category: string;
  description: string;
  userId: string | null;
  userName: string | null;
  targetId: string | null;
  targetName: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/* ─────────────────── Helpers ─────────────────── */

const ACTION_CONFIG: Record<string, { label: string; icon: typeof LogIn; color: string; bg: string }> = {
  LOGIN:             { label: "Login",            icon: LogIn,        color: "text-blue-500",    bg: "bg-blue-500/10" },
  LOGOUT:            { label: "Logout",           icon: LogOut,       color: "text-slate-500",   bg: "bg-slate-500/10" },
  EMPLOYEE_CREATED:  { label: "Employee Created", icon: UserPlus,     color: "text-emerald-500", bg: "bg-emerald-500/10" },
  EMPLOYEE_UPDATED:  { label: "Employee Updated", icon: Pencil,       color: "text-amber-500",   bg: "bg-amber-500/10" },
  EMPLOYEE_DELETED:  { label: "Employee Deleted", icon: UserMinus,    color: "text-rose-500",    bg: "bg-rose-500/10" },
  LEAVE_CREATED:     { label: "Leave Created",    icon: CalendarPlus, color: "text-violet-500",  bg: "bg-violet-500/10" },
  LEAVE_APPROVED:    { label: "Leave Approved",   icon: CheckCircle,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
  LEAVE_REJECTED:    { label: "Leave Rejected",   icon: XCircle,      color: "text-rose-500",    bg: "bg-rose-500/10" },
  LEAVE_CANCELLED:   { label: "Leave Cancelled",  icon: Ban,          color: "text-slate-500",   bg: "bg-slate-500/10" },
  LEAVE_DELETED:     { label: "Leave Deleted",    icon: Trash2,       color: "text-rose-500",    bg: "bg-rose-500/10" },
  LEAVE_UPDATED:     { label: "Leave Updated",    icon: Pencil,       color: "text-amber-500",   bg: "bg-amber-500/10" },
};

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "AUTH", label: "Authentication" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "LEAVE", label: "Leave Request" },
];

const ACTION_OPTIONS = [
  { value: "ALL", label: "All Actions" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "EMPLOYEE_CREATED", label: "Employee Created" },
  { value: "EMPLOYEE_UPDATED", label: "Employee Updated" },
  { value: "EMPLOYEE_DELETED", label: "Employee Deleted" },
  { value: "LEAVE_CREATED", label: "Leave Created" },
  { value: "LEAVE_APPROVED", label: "Leave Approved" },
  { value: "LEAVE_REJECTED", label: "Leave Rejected" },
  { value: "LEAVE_CANCELLED", label: "Leave Cancelled" },
  { value: "LEAVE_DELETED", label: "Leave Deleted" },
];

/* ─────────────────── Action Badge ─────────────────── */

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_CONFIG[action] || {
    label: action,
    icon: ClipboardList,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  };
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", config.bg, config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ─────────────────── Category Dot ─────────────────── */

function CategoryLabel({ category }: { category: string }) {
  const colors: Record<string, string> = {
    AUTH: "bg-blue-500",
    EMPLOYEE: "bg-emerald-500",
    LEAVE: "bg-violet-500",
  };
  const labels: Record<string, string> = {
    AUTH: "Auth",
    EMPLOYEE: "Employee",
    LEAVE: "Leave",
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", colors[category] || "bg-muted-foreground")} />
      {labels[category] || category}
    </span>
  );
}

/* ─────────────────── Main Page ─────────────────── */

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (category !== "ALL") params.set("category", category);
      if (action !== "ALL") params.set("action", action);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const result = await res.json();
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [category, action, search]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePageChange = useCallback((page: number) => {
    fetchLogs(page);
  }, [fetchLogs]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLogs(pagination.page);
  }, [fetchLogs, pagination.page]);

  const handleCategoryChange = useCallback((value: string | null) => {
    setCategory(value ?? "ALL");
    setAction("ALL");
  }, []);

  const handleActionChange = useCallback((value: string | null) => {
    setAction(value ?? "ALL");
  }, []);

  // Filter action options based on selected category
  const filteredActionOptions = useMemo(() => {
    if (category === "ALL") return ACTION_OPTIONS;
    const prefix = category === "AUTH" ? "" : category + "_";
    return [
      { value: "ALL", label: "All Actions" },
      ...ACTION_OPTIONS.filter((opt) => {
        if (opt.value === "ALL") return false;
        if (category === "AUTH") return opt.value === "LOGIN" || opt.value === "LOGOUT";
        return opt.value.startsWith(prefix);
      }),
    ];
  }, [category]);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" subtitle="Track all system actions and changes" />

      {/* Filters */}
      <div className="animate-fade-in-up">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by description, user, or target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs(1)}
                className="h-9 pl-9 rounded-xl text-xs bg-background/60 border-border/50"
              />
            </div>

            {/* Category */}
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs bg-background/60 border-border/50">
                <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action */}
            <Select value={action} onValueChange={handleActionChange}>
              <SelectTrigger className="h-9 w-[180px] rounded-xl text-xs bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredActionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 rounded-xl gap-1.5 text-xs shrink-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </Card>
      </div>

      {/* Logs Table */}
      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No activity logs</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                {search || category !== "ALL" || action !== "ALL"
                  ? "No logs match your current filters. Try broadening your search."
                  : "Activity logs will appear here as actions are performed in the system."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[180px]">Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px]">User</TableHead>
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead className="w-[120px] text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-border/30 hover:bg-accent/30 transition-colors group">
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-md">{log.description}</p>
                        {log.targetName && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            Target: {log.targetName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium truncate block max-w-[100px]">
                          {log.userName || "System"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <CategoryLabel category={log.category} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium tabular-nums flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {timeAgo(log.createdAt)}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50 tabular-nums mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(log.createdAt).toLocaleString("en-US", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border/30 bg-muted/20 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} logs
                </p>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.pageSize}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
