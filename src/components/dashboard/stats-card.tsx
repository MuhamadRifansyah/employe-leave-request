"use client";

import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricKey = "employees" | "pending" | "approved" | "rejected";

export interface MetricConfig {
  key: MetricKey;
  title: string;
  icon: LucideIcon;
  variant: "blue" | "amber" | "emerald" | "red";
  trend?: { value: number; label: string };
}

export const METRIC_COLORS = {
  employees: { stroke: "#3b82f6", light: "#dbeafe", dark: "#1e3a5f" },
  pending:   { stroke: "#f59e0b", light: "#fef3c7", dark: "#78350f" },
  approved:  { stroke: "#10b981", light: "#d1fae5", dark: "#064e3b" },
  rejected:  { stroke: "#ef4444", light: "#fee2e2", dark: "#7f1d1d" },
} as const;

interface StatsCardProps {
  title: string;
  value: number;
  chartValue: number; // latest value from chart data
  icon: LucideIcon;
  variant: "blue" | "amber" | "emerald" | "red";
  metricKey: MetricKey;
  sparklineData: number[];
  trend?: { value: number; label: string };
  isActive?: boolean;
  isAnyActive?: boolean;
  onClick?: (key: MetricKey) => void;
  onHover?: (key: MetricKey | null) => void;
}

const variantStyles = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    gradientSubtle: "from-blue-500/10 to-blue-600/5",
    glow: "shadow-blue-500/25",
    activeRing: "ring-2 ring-blue-500/50",
    activeShadow: "shadow-xl shadow-blue-500/15 dark:shadow-blue-500/25",
    sparkline: "#3b82f6",
    sparklineFill: "rgba(59,130,246,0.1)",
  },
  amber: {
    gradient: "from-amber-500 to-orange-500",
    gradientSubtle: "from-amber-500/10 to-orange-500/5",
    glow: "shadow-amber-500/25",
    activeRing: "ring-2 ring-amber-500/50",
    activeShadow: "shadow-xl shadow-amber-500/15 dark:shadow-amber-500/25",
    sparkline: "#f59e0b",
    sparklineFill: "rgba(245,158,11,0.1)",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-500",
    gradientSubtle: "from-emerald-500/10 to-teal-500/5",
    glow: "shadow-emerald-500/25",
    activeRing: "ring-2 ring-emerald-500/50",
    activeShadow: "shadow-xl shadow-emerald-500/15 dark:shadow-emerald-500/25",
    sparkline: "#10b981",
    sparklineFill: "rgba(16,185,129,0.1)",
  },
  red: {
    gradient: "from-rose-500 to-red-500",
    gradientSubtle: "from-rose-500/10 to-red-500/5",
    glow: "shadow-rose-500/25",
    activeRing: "ring-2 ring-rose-500/50",
    activeShadow: "shadow-xl shadow-rose-500/15 dark:shadow-rose-500/25",
    sparkline: "#ef4444",
    sparklineFill: "rgba(239,68,68,0.1)",
  },
};

// Tiny sparkline SVG drawn inline
function Sparkline({
  data,
  color,
  fill,
  isActive,
}: {
  data: number[];
  color: string;
  fill: string;
  isActive: boolean;
}) {
  if (data.length < 2) return null;
  const h = 32;
  const w = 80;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h * 0.85 - 2,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn(
        "transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"
      )}
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dot on last point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={isActive ? 3 : 2} fill={color} className="transition-all duration-300" />
    </svg>
  );
}

export function StatsCard({
  title,
  value,
  chartValue,
  icon: Icon,
  variant,
  metricKey,
  sparklineData,
  trend,
  isActive = false,
  isAnyActive = false,
  onClick,
  onHover,
}: StatsCardProps) {
  const s = variantStyles[variant];
  const dimmed = isAnyActive && !isActive;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer select-none",
        "transition-all duration-300 ease-out",
        isActive
          ? cn(s.activeRing, s.activeShadow, "-translate-y-1.5")
          : "hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/20 hover:-translate-y-0.5",
        dimmed && "opacity-40 scale-[0.97] blur-[0.3px]"
      )}
      onClick={() => onClick?.(metricKey)}
      onMouseEnter={() => onHover?.(metricKey)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Active gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 pointer-events-none",
        s.gradientSubtle,
        isActive ? "opacity-100" : "opacity-0"
      )} />

      <div className="relative p-5">
        {/* Top row: icon + sparkline */}
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br transition-all duration-300",
            s.gradient, s.glow,
            isActive && "scale-110 shadow-xl"
          )}>
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>
          <Sparkline
            data={sparklineData}
            color={s.sparkline}
            fill={s.sparklineFill}
            isActive={isActive}
          />
        </div>

        {/* Value */}
        <div className="space-y-1.5">
          <p className={cn(
            "text-sm font-medium transition-colors duration-200",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {chartValue !== value && (
              <span className="text-xs text-muted-foreground font-medium">
                ({chartValue} in chart)
              </span>
            )}
          </div>
        </div>

        {/* Trend + active indicator */}
        <div className="flex items-center justify-between mt-3">
          {trend ? (
            <div className="flex items-center gap-1.5">
              {trend.value >= 0 ? (
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    +{trend.value}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-full bg-rose-500/10 px-1.5 py-0.5">
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {trend.value}%
                  </span>
                </div>
              )}
              <span className="text-[11px] text-muted-foreground">{trend.label}</span>
            </div>
          ) : <div />}
          <ArrowRight className={cn(
            "h-3.5 w-3.5 transition-all duration-300",
            isActive
              ? "opacity-100 translate-x-0 text-foreground"
              : "opacity-0 -translate-x-2 text-muted-foreground group-hover:opacity-60 group-hover:translate-x-0"
          )} />
        </div>
      </div>

      {/* Bottom accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r transition-all duration-300",
        s.gradient,
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
      )} />
    </Card>
  );
}
