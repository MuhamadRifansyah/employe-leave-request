import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize, serializeArray } from "@/lib/serialize";
import { LeaveStatus } from "@prisma/client";

// Helper: calculate number of days between two date strings (inclusive)
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
}

// Helper: format a Date to "YYYY-MM"
function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Helper: format a month key "YYYY-MM" to a label like "Jun 2026"
function toMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ---------- Monthly Report ----------
async function getMonthlyReport(month?: string) {
  const whereClause: Record<string, unknown> = {};

  if (month) {
    // Filter to a specific month (e.g. "2026-06")
    const [year, mon] = month.split("-").map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);
    whereClause.createdAt = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  } else {
    // Last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1
    );
    whereClause.createdAt = {
      gte: twelveMonthsAgo,
    };
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  // Group by month
  const monthMap = new Map<
    string,
    {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    }
  >();

  for (const req of leaveRequests) {
    const key = toMonthKey(new Date(req.createdAt));
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      });
    }
    const entry = monthMap.get(key)!;
    entry.total++;
    switch (req.status) {
      case LeaveStatus.PENDING:
        entry.pending++;
        break;
      case LeaveStatus.APPROVED:
        entry.approved++;
        break;
      case LeaveStatus.REJECTED:
        entry.rejected++;
        break;
      case LeaveStatus.CANCELLED:
        entry.cancelled++;
        break;
    }
  }

  // Build sorted monthly data
  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, stats]) => ({
      month: key,
      monthLabel: toMonthLabel(key),
      ...stats,
    }));

  // Summary
  const totalRequests = leaveRequests.length;
  const approved = leaveRequests.filter(
    (r) => r.status === LeaveStatus.APPROVED
  ).length;
  const rejected = leaveRequests.filter(
    (r) => r.status === LeaveStatus.REJECTED
  ).length;
  const pending = leaveRequests.filter(
    (r) => r.status === LeaveStatus.PENDING
  ).length;
  const cancelled = leaveRequests.filter(
    (r) => r.status === LeaveStatus.CANCELLED
  ).length;
  const approvalRate =
    totalRequests > 0
      ? Math.round((approved / totalRequests) * 100 * 100) / 100
      : 0;

  return {
    months: serializeArray(months),
    summary: serialize({
      totalRequests,
      approved,
      rejected,
      pending,
      cancelled,
      approvalRate,
    }),
  };
}

// ---------- Employee Report ----------
async function getEmployeeReport(search?: string, department?: string) {
  const whereClause: Record<string, unknown> = {};

  if (search) {
    whereClause.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (department) {
    whereClause.department = department;
  }

  const employees = await prisma.employee.findMany({
    where: whereClause,
    include: {
      leaveRequests: true,
    },
    orderBy: { name: "asc" },
  });

  const employeeData = employees.map((emp) => {
    const requests = emp.leaveRequests;
    const approved = requests.filter(
      (r) => r.status === LeaveStatus.APPROVED
    ).length;
    const rejected = requests.filter(
      (r) => r.status === LeaveStatus.REJECTED
    ).length;
    const pending = requests.filter(
      (r) => r.status === LeaveStatus.PENDING
    ).length;
    const cancelled = requests.filter(
      (r) => r.status === LeaveStatus.CANCELLED
    ).length;

    const totalDaysUsed = requests
      .filter((r) => r.status === LeaveStatus.APPROVED)
      .reduce((sum, r) => sum + calculateDays(r.startDate, r.endDate), 0);

    return {
      id: emp.id,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      leaveBalance: emp.leaveBalance,
      totalRequests: requests.length,
      approved,
      rejected,
      pending,
      cancelled,
      totalDaysUsed,
    };
  });

  return serializeArray(employeeData);
}

// ---------- Department Report ----------
async function getDepartmentReport() {
  const employees = await prisma.employee.findMany({
    include: {
      leaveRequests: true,
    },
  });

  // Group by department
  const deptMap = new Map<
    string,
    {
      totalEmployees: number;
      totalLeaveBalance: number;
      totalRequests: number;
      approved: number;
      rejected: number;
      pending: number;
      cancelled: number;
      totalDaysUsed: number;
    }
  >();

  for (const emp of employees) {
    const dept = emp.department;
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        totalEmployees: 0,
        totalLeaveBalance: 0,
        totalRequests: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        cancelled: 0,
        totalDaysUsed: 0,
      });
    }

    const entry = deptMap.get(dept)!;
    entry.totalEmployees++;
    entry.totalLeaveBalance += emp.leaveBalance;

    for (const req of emp.leaveRequests) {
      entry.totalRequests++;
      switch (req.status) {
        case LeaveStatus.PENDING:
          entry.pending++;
          break;
        case LeaveStatus.APPROVED:
          entry.approved++;
          entry.totalDaysUsed += calculateDays(req.startDate, req.endDate);
          break;
        case LeaveStatus.REJECTED:
          entry.rejected++;
          break;
        case LeaveStatus.CANCELLED:
          entry.cancelled++;
          break;
      }
    }
  }

  const departments = Array.from(deptMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, stats]) => ({
      department: dept,
      ...stats,
      avgBalancePerEmployee:
        stats.totalEmployees > 0
          ? Math.round(
              (stats.totalLeaveBalance / stats.totalEmployees) * 100
            ) / 100
          : 0,
    }));

  return serializeArray(departments);
}

// ---------- GET Handler ----------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const month = searchParams.get("month") || undefined;
    const department = searchParams.get("department") || undefined;
    const search = searchParams.get("search") || undefined;

    switch (type) {
      case "monthly": {
        const monthly = await getMonthlyReport(month);
        return NextResponse.json({ data: { monthly } });
      }

      case "employee": {
        const employees = await getEmployeeReport(search, department);
        return NextResponse.json({ data: { employees } });
      }

      case "department": {
        const departments = await getDepartmentReport();
        return NextResponse.json({ data: { departments } });
      }

      default: {
        // Return all 3 datasets
        const [monthly, employees, departments] = await Promise.all([
          getMonthlyReport(month),
          getEmployeeReport(search, department),
          getDepartmentReport(),
        ]);

        return NextResponse.json({
          data: {
            monthly,
            employees,
            departments,
          },
        });
      }
    }
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
      },
      { status: 500 }
    );
  }
}
