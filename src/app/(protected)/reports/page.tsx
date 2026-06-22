"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Users,
  Building2,
  FileSpreadsheet,
  FileText,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPdf } from "@/lib/report-export";

/* ──────────────────────────── Types ──────────────────────────── */

interface MonthlyRow {
  month: string;
  monthLabel: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

interface EmployeeRow {
  id: string;
  name: string;
  department: string;
  position: string;
  leaveBalance: number;
  totalRequests: number;
  approved: number;
  rejected: number;
  pending: number;
  cancelled: number;
  totalDaysUsed: number;
}

interface DepartmentRow {
  department: string;
  totalEmployees: number;
  totalLeaveBalance: number;
  totalRequests: number;
  approved: number;
  rejected: number;
  pending: number;
  cancelled: number;
  totalDaysUsed: number;
  avgBalancePerEmployee: number;
}

interface Summary {
  totalRequests: number;
  approved: number;
  rejected: number;
  pending: number;
  cancelled: number;
  approvalRate: number;
}

interface ReportData {
  monthly: MonthlyRow[];
  employees: EmployeeRow[];
  departments: DepartmentRow[];
  summary: Summary;
}

/* ──────────────────────────── Summary Cards ──────────────────────────── */

function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    { label: "Total Requests", value: summary.totalRequests, icon: CalendarDays, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Pending", value: summary.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Approved", value: summary.approved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Rejected", value: summary.rejected, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Cancelled", value: summary.cancelled, icon: Ban, color: "text-slate-500", bg: "bg-slate-500/10" },
    { label: "Approval Rate", value: `${summary.approvalRate}%`, icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", c.bg)}>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
              <p className="text-lg font-bold tabular-nums">{c.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ──────────────────────────── Export Toolbar ──────────────────────────── */

function ExportToolbar({
  onExportExcel,
  onExportPdf,
  disabled,
}: {
  onExportExcel: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportExcel}
        disabled={disabled}
        className="rounded-lg gap-1.5 text-xs h-8"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPdf}
        disabled={disabled}
        className="rounded-lg gap-1.5 text-xs h-8"
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </Button>
    </div>
  );
}

/* ──────────────────────────── Monthly Report ──────────────────────────── */

function MonthlyReport({ data }: { data: MonthlyRow[] }) {

  const handleExportExcel = () => {
    exportToExcel(data as unknown as Record<string, unknown>[], "monthly-leave-report", "Monthly");
    toast.success("Excel report downloaded");
  };

  const handleExportPdf = () => {
    exportToPdf(data as unknown as Record<string, unknown>[], "monthly-leave-report", "Monthly Leave Report", [
      { key: "monthLabel", label: "Month" },
      { key: "total", label: "Total" },
      { key: "approved", label: "Approved" },
      { key: "rejected", label: "Rejected" },
      { key: "pending", label: "Pending" },
      { key: "cancelled", label: "Cancelled" },
    ]);
    toast.success("PDF report opened for printing");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Monthly Breakdown</h3>
          <span className="text-xs text-muted-foreground">({data.length} months)</span>
        </div>
        <ExportToolbar onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} disabled={data.length === 0} />
      </div>

      {data.length === 0 ? (
        <Card className="p-8 border-border/50 bg-card/80 text-center text-sm text-muted-foreground">
          No leave request data available for the selected period.
        </Card>
      ) : (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[160px]">Month</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Cancelled</TableHead>
                <TableHead className="w-[200px]">Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month} className="border-border/30 hover:bg-accent/30 transition-colors">
                  <TableCell className="font-medium">{row.monthLabel}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">{row.approved}</TableCell>
                  <TableCell className="text-right tabular-nums text-rose-600">{row.rejected}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600">{row.pending}</TableCell>
                  <TableCell className="text-right tabular-nums text-slate-500">{row.cancelled}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden flex">
                        {row.total > 0 && (
                          <>
                            <div className="h-full bg-emerald-500" style={{ width: `${(row.approved / row.total) * 100}%` }} />
                            <div className="h-full bg-rose-500" style={{ width: `${(row.rejected / row.total) * 100}%` }} />
                            <div className="h-full bg-amber-500" style={{ width: `${(row.pending / row.total) * 100}%` }} />
                            <div className="h-full bg-slate-400" style={{ width: `${(row.cancelled / row.total) * 100}%` }} />
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">
                        {row.total}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

/* ──────────────────────────── Employee Report ──────────────────────────── */

function EmployeeReport({
  data,
  departments,
}: {
  data: EmployeeRow[];
  departments: string[];
}) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const handleDeptChange = useCallback((value: string | null) => {
    setDeptFilter(value ?? "ALL");
  }, []);

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
      );
    }
    if (deptFilter !== "ALL") {
      result = result.filter((e) => e.department === deptFilter);
    }
    return result;
  }, [data, search, deptFilter]);

  const handleExportExcel = () => {
    const rows = filtered.map((e) => ({
      Name: e.name,
      Department: e.department,
      Position: e.position,
      "Leave Balance": e.leaveBalance,
      "Total Requests": e.totalRequests,
      Approved: e.approved,
      Rejected: e.rejected,
      Pending: e.pending,
      Cancelled: e.cancelled,
      "Days Used": e.totalDaysUsed,
    }));
    exportToExcel(rows as unknown as Record<string, unknown>[], "employee-leave-report");
    toast.success("Excel report downloaded");
  };

  const handleExportPdf = () => {
    exportToPdf(
      filtered as unknown as Record<string, unknown>[],
      "employee-leave-report",
      "Employee Leave Summary",
      [
        { key: "name", label: "Name" },
        { key: "department", label: "Department" },
        { key: "leaveBalance", label: "Balance" },
        { key: "totalRequests", label: "Requests" },
        { key: "approved", label: "Approved" },
        { key: "rejected", label: "Rejected" },
        { key: "totalDaysUsed", label: "Days Used" },
      ]
    );
    toast.success("PDF report opened for printing");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 rounded-lg text-xs bg-background/60 border-border/50"
            />
          </div>
          <Select value={deptFilter} onValueChange={handleDeptChange}>
            <SelectTrigger className="h-8 w-[180px] rounded-lg text-xs bg-background/60 border-border/50">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ExportToolbar onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} disabled={filtered.length === 0} />
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No employees match the current filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[200px]">Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Rejected</TableHead>
                  <TableHead className="text-right">Days Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.id} className="border-border/30 hover:bg-accent/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.position}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium">
                        {emp.department}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-semibold tabular-nums",
                        emp.leaveBalance <= 3 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {emp.leaveBalance}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{emp.totalRequests}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600">{emp.approved}</TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600">{emp.rejected}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums">{emp.totalDaysUsed}</span>
                      <span className="text-xs text-muted-foreground ml-0.5">d</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 py-3 border-t border-border/30 bg-muted/20 text-xs text-muted-foreground">
              Showing {filtered.length} of {data.length} employees
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ──────────────────────────── Department Report ──────────────────────────── */

function DepartmentReport({ data }: { data: DepartmentRow[] }) {
  const handleExportExcel = () => {
    const rows = data.map((d) => ({
      Department: d.department,
      Employees: d.totalEmployees,
      "Total Balance": d.totalLeaveBalance,
      "Avg Balance": d.avgBalancePerEmployee,
      "Total Requests": d.totalRequests,
      Approved: d.approved,
      Rejected: d.rejected,
      Pending: d.pending,
      "Days Used": d.totalDaysUsed,
    }));
    exportToExcel(rows as unknown as Record<string, unknown>[], "department-leave-report");
    toast.success("Excel report downloaded");
  };

  const handleExportPdf = () => {
    exportToPdf(
      data as unknown as Record<string, unknown>[],
      "department-leave-report",
      "Department Leave Summary",
      [
        { key: "department", label: "Department" },
        { key: "totalEmployees", label: "Employees" },
        { key: "totalLeaveBalance", label: "Total Balance" },
        { key: "avgBalancePerEmployee", label: "Avg Balance" },
        { key: "totalRequests", label: "Requests" },
        { key: "approved", label: "Approved" },
        { key: "totalDaysUsed", label: "Days Used" },
      ]
    );
    toast.success("PDF report opened for printing");
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Department Overview</h3>
          <span className="text-xs text-muted-foreground">({data.length} departments)</span>
        </div>
        <ExportToolbar onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} disabled={data.length === 0} />
      </div>

      {data.length === 0 ? (
        <Card className="p-8 border-border/50 bg-card/80 text-center text-sm text-muted-foreground">
          No department data available.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((dept) => {
            const decided = dept.approved + dept.rejected;
            const approvalRate = decided > 0 ? Math.round((dept.approved / decided) * 100) : 0;
            return (
              <Card key={dept.department} className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-200">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{dept.department}</h4>
                        <p className="text-xs text-muted-foreground">{dept.totalEmployees} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{dept.totalRequests}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Requests</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-emerald-500/5">
                      <p className="text-xs font-bold tabular-nums text-emerald-600">{dept.approved}</p>
                      <p className="text-[9px] text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-rose-500/5">
                      <p className="text-xs font-bold tabular-nums text-rose-600">{dept.rejected}</p>
                      <p className="text-[9px] text-muted-foreground">Rejected</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-500/5">
                      <p className="text-xs font-bold tabular-nums text-amber-600">{dept.pending}</p>
                      <p className="text-[9px] text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-violet-500/5">
                      <p className="text-xs font-bold tabular-nums text-violet-600">{dept.totalDaysUsed}d</p>
                      <p className="text-[9px] text-muted-foreground">Used</p>
                    </div>
                  </div>

                  {/* Balance + approval rate */}
                  <div className="flex items-center justify-between text-xs border-t border-border/30 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Avg Balance:</span>
                      <span className={cn(
                        "font-semibold tabular-nums",
                        dept.avgBalancePerEmployee <= 3 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {dept.avgBalancePerEmployee}d
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Approval:</span>
                      <span className="font-semibold tabular-nums">{approvalRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom accent bar */}
                <div className="h-1 flex">
                  {dept.totalRequests > 0 ? (
                    <>
                      <div className="bg-emerald-500 h-full" style={{ width: `${(dept.approved / dept.totalRequests) * 100}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${(dept.rejected / dept.totalRequests) * 100}%` }} />
                      <div className="bg-amber-500 h-full" style={{ width: `${(dept.pending / dept.totalRequests) * 100}%` }} />
                      <div className="bg-slate-400 h-full" style={{ width: `${(dept.cancelled / dept.totalRequests) * 100}%` }} />
                    </>
                  ) : (
                    <div className="bg-muted h-full w-full" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Main Page ──────────────────────────── */

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState("monthly");

  const handleTabChange = useCallback((value: string | null) => {
    if (value) setActiveTab(value);
  }, []);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const { data } = await res.json();
        // API returns: data.monthly = { months, summary }, data.employees, data.departments
        // Frontend expects: { monthly: MonthlyRow[], employees, departments, summary }
        setReportData({
          monthly: data.monthly?.months ?? [],
          employees: data.employees ?? [],
          departments: data.departments ?? [],
          summary: data.monthly?.summary ?? {
            totalRequests: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
            cancelled: 0,
            approvalRate: 0,
          },
        });
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        toast.error("Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const departments = useMemo(
    () => (reportData?.departments || []).map((d) => d.department).sort(),
    [reportData]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" subtitle="Comprehensive leave analytics and exports" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" subtitle="Comprehensive leave analytics and exports" />
        <Card className="p-12 border-border/50 bg-card/80 text-center">
          <p className="text-muted-foreground">Failed to load report data. Please try again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Comprehensive leave analytics and exports" />

      {/* Summary Cards */}
      <div className="animate-fade-in-up">
        <SummaryCards summary={reportData.summary} />
      </div>

      {/* Tabbed Reports */}
      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-muted/50 border border-border/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="monthly" className="rounded-lg gap-1.5 text-xs px-3 py-1.5 data-[active]:bg-background data-[active]:shadow-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              Monthly Report
            </TabsTrigger>
            <TabsTrigger value="employee" className="rounded-lg gap-1.5 text-xs px-3 py-1.5 data-[active]:bg-background data-[active]:shadow-sm">
              <Users className="h-3.5 w-3.5" />
              Employee Summary
            </TabsTrigger>
            <TabsTrigger value="department" className="rounded-lg gap-1.5 text-xs px-3 py-1.5 data-[active]:bg-background data-[active]:shadow-sm">
              <Building2 className="h-3.5 w-3.5" />
              Department Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-4">
            <MonthlyReport data={reportData.monthly} />
          </TabsContent>

          <TabsContent value="employee" className="mt-4">
            <EmployeeReport data={reportData.employees} departments={departments} />
          </TabsContent>

          <TabsContent value="department" className="mt-4">
            <DepartmentReport data={reportData.departments} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
