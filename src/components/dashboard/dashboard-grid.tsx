"use client";

import { type MetricKey } from "./stats-card";
import { StatsCard } from "./stats-card";
import { LeaveChart, type ChartDataPoint } from "./leave-chart";
import { RecentActivity } from "./recent-activity";
import { LeaveBalanceSummary } from "./leave-balance-summary";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";

interface DashboardStats {
  totalEmployees: number;
  pendingLeave: number;
  approvedLeave: number;
  rejectedLeave: number;
  cancelledLeave: number;
  trends: {
    employees: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  leaveBalance: {
    total: number;
    average: number;
    min: number;
    max: number;
    lowBalanceEmployees: Array<{
      id: string;
      name: string;
      department: string;
      leaveBalance: number;
    }>;
  };
}

export function DashboardGrid() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<MetricKey | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<unknown[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const { data } = await res.json();

        setStats({
          totalEmployees: data.totalEmployees,
          pendingLeave: data.pendingLeave,
          approvedLeave: data.approvedLeave,
          rejectedLeave: data.rejectedLeave,
          cancelledLeave: data.cancelledLeave,
          trends: data.trends,
          leaveBalance: data.leaveBalance,
        });

        // Use real monthly data from the API
        if (data.monthlyData && data.monthlyData.length > 0) {
          setChartData(
            data.monthlyData.map((m: {
              month: string;
              employees: number;
              pending: number;
              approved: number;
              rejected: number;
            }) => ({
              month: m.month,
              employees: m.employees,
              pending: m.pending,
              approved: m.approved,
              rejected: m.rejected,
            }))
          );
        }

        // Store recent data for RecentActivity
        if (data.recentLeaves) setRecentLeaves(data.recentLeaves);
        if (data.recentEmployees) setRecentEmployees(data.recentEmployees);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Unable to load dashboard data. Please check your database connection.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = useCallback((key: MetricKey) => {
    setActiveMetric((prev) => (prev === key ? null : key));
  }, []);

  const handleHover = useCallback((key: MetricKey | null) => {
    setHoveredMetric(key);
  }, []);

  const isAnyActive = activeMetric !== null || hoveredMetric !== null;

  // Derive sparkline data from real chart data
  const sparklines = useMemo(() => {
    if (!chartData.length) return { employees: [], pending: [], approved: [], rejected: [] };
    return {
      employees: chartData.map((d) => d.employees),
      pending: chartData.map((d) => d.pending),
      approved: chartData.map((d) => d.approved),
      rejected: chartData.map((d) => d.rejected),
    };
  }, [chartData]);

  const latestChartValues = useMemo(() => {
    if (!chartData.length) return { employees: 0, pending: 0, approved: 0, rejected: 0 };
    const last = chartData[chartData.length - 1];
    return {
      employees: last.employees,
      pending: last.pending,
      approved: last.approved,
      rejected: last.rejected,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 h-64 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
          <div className="lg:col-span-2 h-64 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 h-48 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
          <div className="lg:col-span-2 h-48 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Dashboard Unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {error || "Unable to load dashboard data."}
        </p>
        <button
          onClick={() => { setError(null); setIsLoading(true); window.location.reload(); }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row — connected to chart via shared data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <StatsCard
            title="Total Employees"
            value={stats.totalEmployees}
            chartValue={latestChartValues.employees}
            icon={Users}
            variant="blue"
            metricKey="employees"
            sparklineData={sparklines.employees}
            trend={{ value: stats.trends.employees, label: "vs last month" }}
            isActive={activeMetric === "employees" || hoveredMetric === "employees"}
            isAnyActive={isAnyActive}
            onClick={handleClick}
            onHover={handleHover}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <StatsCard
            title="Pending Leave"
            value={stats.pendingLeave}
            chartValue={latestChartValues.pending}
            icon={Clock}
            variant="amber"
            metricKey="pending"
            sparklineData={sparklines.pending}
            trend={{ value: stats.trends.pending, label: "vs last month" }}
            isActive={activeMetric === "pending" || hoveredMetric === "pending"}
            isAnyActive={isAnyActive}
            onClick={handleClick}
            onHover={handleHover}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <StatsCard
            title="Approved Leave"
            value={stats.approvedLeave}
            chartValue={latestChartValues.approved}
            icon={CheckCircle}
            variant="emerald"
            metricKey="approved"
            sparklineData={sparklines.approved}
            trend={{ value: stats.trends.approved, label: "vs last month" }}
            isActive={activeMetric === "approved" || hoveredMetric === "approved"}
            isAnyActive={isAnyActive}
            onClick={handleClick}
            onHover={handleHover}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <StatsCard
            title="Rejected Leave"
            value={stats.rejectedLeave}
            chartValue={latestChartValues.rejected}
            icon={XCircle}
            variant="red"
            metricKey="rejected"
            sparklineData={sparklines.rejected}
            trend={{ value: stats.trends.rejected, label: "vs last month" }}
            isActive={activeMetric === "rejected" || hoveredMetric === "rejected"}
            isAnyActive={isAnyActive}
            onClick={handleClick}
            onHover={handleHover}
          />
        </div>
      </div>

      {/* Analytics Chart + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <LeaveChart
            activeMetric={activeMetric}
            hoveredMetric={hoveredMetric}
            data={chartData}
          />
        </div>
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
          <RecentActivity
            recentLeaves={recentLeaves as never[]}
            recentEmployees={recentEmployees as never[]}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Leave Balance Summary */}
      <div className="animate-fade-in-up" style={{ animationDelay: "360ms" }}>
        <LeaveBalanceSummary
          total={stats.leaveBalance.total}
          average={stats.leaveBalance.average}
          min={stats.leaveBalance.min}
          max={stats.leaveBalance.max}
          lowBalanceEmployees={stats.leaveBalance.lowBalanceEmployees}
          totalEmployees={stats.totalEmployees}
        />
      </div>
    </div>
  );
}
