"use client";

import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { type MetricKey, METRIC_COLORS } from "./stats-card";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

export interface ChartDataPoint {
  month: string;
  employees: number;
  approved: number;
  rejected: number;
  pending: number;
}

const METRIC_LABELS: Record<MetricKey, string> = {
  employees: "Total Employees",
  pending: "Pending Leave",
  approved: "Approved Leave",
  rejected: "Rejected Leave",
};

const seriesKeys: MetricKey[] = ["employees", "pending", "approved", "rejected"];

interface LeaveChartProps {
  activeMetric: MetricKey | null;
  hoveredMetric: MetricKey | null;
  data: ChartDataPoint[];
}

function computeInsights(data: ChartDataPoint[], key: MetricKey) {
  const values = data.map((d) => d[key]);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / (values.length || 1);
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const latest = values.length > 0 ? values[values.length - 1] : 0;
  const prev = values.length > 1 ? values[values.length - 2] : 0;
  const change = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
  const maxMonth = values.length > 0 ? data[values.indexOf(max)].month : "";
  return { total, avg: +avg.toFixed(1), max, min, latest, change: +change.toFixed(1), maxMonth };
}

function CustomTooltip({
  active,
  payload,
  label,
  highlighted,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  highlighted?: MetricKey | null;
}) {
  if (active && payload && payload.length) {
    const filteredPayload = highlighted
      ? payload.filter((p) => p.dataKey === highlighted)
      : payload;

    return (
      <div className="rounded-xl bg-popover/95 backdrop-blur-md p-3.5 shadow-2xl shadow-black/10 border border-border/60 min-w-[140px]">
        <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1.5">
          {filteredPayload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-popover"
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}40` }}
                />
                <span className="text-muted-foreground capitalize">{entry.name}</span>
              </div>
              <span className="font-semibold tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function LeaveChart({ activeMetric, hoveredMetric, data }: LeaveChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const highlighted = hoveredMetric || activeMetric;
  const insights = useMemo(
    () => (highlighted && data.length > 0 ? computeInsights(data, highlighted) : null),
    [highlighted, data]
  );

  if (!mounted)
    return <div className="h-[460px] animate-pulse bg-muted rounded-2xl" />;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Analytics Overview</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {highlighted ? (
                <span className="inline-flex items-center gap-1.5 transition-all duration-200">
                  Focused on
                  <span
                    className="inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      color: METRIC_COLORS[highlighted].stroke,
                      backgroundColor: `${METRIC_COLORS[highlighted].stroke}15`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: METRIC_COLORS[highlighted].stroke }}
                    />
                    {METRIC_LABELS[highlighted]}
                  </span>
                </span>
              ) : (
                "Select a metric card to explore detailed insights"
              )}
            </p>
          </div>
        </div>

        {/* KPI Insights Panel — slides in when metric is active */}
        <div
          className={cn(
            "grid grid-cols-4 gap-3 overflow-hidden transition-all duration-500 ease-out",
            insights ? "max-h-[80px] opacity-100 mt-5" : "max-h-0 opacity-0 mt-0"
          )}
        >
          {insights && highlighted && (
            <>
              <InsightPill label="Latest" value={insights.latest} color={METRIC_COLORS[highlighted].stroke} />
              <InsightPill label="Average" value={insights.avg} />
              <InsightPill label={`Peak (${insights.maxMonth})`} value={insights.max} />
              <InsightPill
                label="MoM Change"
                value={`${insights.change >= 0 ? "+" : ""}${insights.change}%`}
                icon={insights.change >= 0 ? TrendingUp : TrendingDown}
                iconColor={insights.change >= 0 ? "#10b981" : "#ef4444"}
              />
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex flex-wrap items-center gap-1 px-6 mt-4 mb-2">
        {seriesKeys.map((key) => {
          const isActive = !highlighted || highlighted === key;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-300",
                isActive && highlighted === key
                  ? "bg-foreground/5"
                  : "opacity-100",
                !isActive && "opacity-25"
              )}
            >
              <div
                className="h-2 w-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: METRIC_COLORS[key].stroke,
                  boxShadow: isActive && highlighted === key ? `0 0 8px ${METRIC_COLORS[key].stroke}60` : "none",
                  transform: isActive && highlighted === key ? "scale(1.3)" : "scale(1)",
                }}
              />
              {METRIC_LABELS[key]}
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
          >
            <defs>
              {seriesKeys.map((key) => {
                const isActive = !highlighted || highlighted === key;
                return (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={METRIC_COLORS[key].stroke}
                      stopOpacity={isActive && highlighted === key ? 0.4 : 0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor={METRIC_COLORS[key].stroke}
                      stopOpacity={0}
                    />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 6%)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "oklch(0.5 0 0 / 50%)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.5 0 0 / 50%)" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              content={<CustomTooltip highlighted={highlighted} />}
              cursor={{ stroke: "oklch(0.5 0 0 / 10%)", strokeWidth: 1 }}
            />
            {seriesKeys.map((key) => {
              const isFocused = highlighted === key;
              const isVisible = !highlighted || isFocused;
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={METRIC_LABELS[key]}
                  stroke={METRIC_COLORS[key].stroke}
                  fill={`url(#grad-${key})`}
                  strokeWidth={isFocused ? 2.5 : 1.5}
                  fillOpacity={isVisible ? 1 : 0}
                  strokeOpacity={isVisible ? 1 : 0.08}
                  animationDuration={600}
                  animationEasing="ease-out"
                  dot={isFocused ? {
                    r: 3,
                    fill: METRIC_COLORS[key].stroke,
                    stroke: "#fff",
                    strokeWidth: 2,
                  } : false}
                  activeDot={isVisible ? {
                    r: isFocused ? 5 : 3,
                    fill: METRIC_COLORS[key].stroke,
                    stroke: "#fff",
                    strokeWidth: 2,
                    style: { filter: isFocused ? `drop-shadow(0 0 4px ${METRIC_COLORS[key].stroke}80)` : "none" },
                  } : false}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// Small insight stat pill
function InsightPill({
  label,
  value,
  color,
  icon: IconComp,
  iconColor,
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 border border-border/30 p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {IconComp && <IconComp className="h-3 w-3" style={{ color: iconColor }} />}
        <p className="text-sm font-bold tabular-nums" style={color ? { color } : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}
