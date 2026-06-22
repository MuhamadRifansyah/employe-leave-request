"use client";

import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/constants";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

function UnauthorizedHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "unauthorized") {
      toast.error("Access denied", {
        description: "You don't have permission to access that page.",
      });
    }
  }, [searchParams]);
  return null;
}

export default function DashboardPage() {
  const { session } = useAuth();

  const displayName = session?.displayName || session?.username || "User";
  const roleLabel = session?.role ? ROLE_LABELS[session.role] : "";

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <UnauthorizedHandler />
      </Suspense>
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {roleLabel && <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mr-2">{roleLabel}</span>}
          Here&apos;s what&apos;s happening with your team today.
        </p>
      </div>
      <DashboardGrid />
    </div>
  );
}
