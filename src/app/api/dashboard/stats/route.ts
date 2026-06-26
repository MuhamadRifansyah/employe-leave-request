import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize, serializeArray } from "@/lib/serialize";
import { LeaveStatus } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Core counts
    const [
      totalEmployees,
      pendingLeave,
      approvedLeave,
      rejectedLeave,
      cancelledLeave,
      recentLeaves,
      recentEmployees,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.APPROVED } }),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.REJECTED } }),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.CANCELLED } }),
      prisma.leaveRequest.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: { name: true, department: true },
          },
        },
      }),
      prisma.employee.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Leave balance summary — aggregate from all employees
    const balanceAgg = await prisma.employee.aggregate({
      _sum: { leaveBalance: true },
      _avg: { leaveBalance: true },
      _min: { leaveBalance: true },
      _max: { leaveBalance: true },
    });

    // Employees with low balance (≤ 3 days)
    const lowBalanceEmployees = await prisma.employee.findMany({
      where: { leaveBalance: { lte: 3 } },
      select: { id: true, name: true, department: true, leaveBalance: true },
      orderBy: { leaveBalance: "asc" },
      take: 5,
    });

    // Monthly leave chart data — last 6 months from actual leave_requests
    // Group by month using createdAt (which is a DateTime in the DB)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const allLeaves = await prisma.leaveRequest.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    // Also get employee count growth by month
    const allEmployees = await prisma.employee.findMany({
      select: { createdAt: true },
    });

    // Build monthly buckets
    const monthlyData: Array<{
      month: string;
      monthKey: string;
      employees: number;
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    }> = [];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = monthNames[d.getMonth()];

      // Count employees that existed by end of this month
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const empCount = allEmployees.filter(
        (e) => new Date(e.createdAt) <= endOfMonth
      ).length;

      // Count leaves created in this month
      const leavesInMonth = allLeaves.filter((l) => {
        const created = new Date(l.createdAt);
        return (
          created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth()
        );
      });

      monthlyData.push({
        month: monthLabel,
        monthKey,
        employees: empCount,
        pending: leavesInMonth.filter((l) => l.status === LeaveStatus.PENDING).length,
        approved: leavesInMonth.filter((l) => l.status === LeaveStatus.APPROVED).length,
        rejected: leavesInMonth.filter((l) => l.status === LeaveStatus.REJECTED).length,
        cancelled: leavesInMonth.filter((l) => l.status === LeaveStatus.CANCELLED).length,
      });
    }

    // Compute trend percentages (current vs previous month)
    const currentMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

    function trendPercent(current: number, previous: number | undefined): number {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    const trends = {
      employees: trendPercent(currentMonth.employees, prevMonth?.employees),
      pending: trendPercent(currentMonth.pending, prevMonth?.pending),
      approved: trendPercent(currentMonth.approved, prevMonth?.approved),
      rejected: trendPercent(currentMonth.rejected, prevMonth?.rejected),
    };

    return NextResponse.json({
      data: {
        totalEmployees,
        pendingLeave,
        approvedLeave,
        rejectedLeave,
        cancelledLeave,
        trends,
        leaveBalance: {
          total: balanceAgg._sum.leaveBalance ?? 0,
          average: Math.round((balanceAgg._avg.leaveBalance ?? 0) * 10) / 10,
          min: balanceAgg._min.leaveBalance ?? 0,
          max: balanceAgg._max.leaveBalance ?? 0,
          lowBalanceEmployees,
        },
        monthlyData,
        recentLeaves: recentLeaves.map((leave) => {
          const { employee, ...rest } = leave;
          return {
            ...serialize(rest),
            employee,
          };
        }),
        recentEmployees: serializeArray(recentEmployees),
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
