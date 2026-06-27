import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize, serializeArray } from "@/lib/serialize";
import { LeaveStatus } from "@prisma/client";
import { ActivityLogger } from "@/lib/activity-logger";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const where: {
      status?: LeaveStatus;
      employeeId?: string;
    } = {};

    if (status && Object.values(LeaveStatus).includes(status as LeaveStatus)) {
      where.status = status as LeaveStatus;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: serializeArray(leaveRequests) });
  } catch (error) {
    console.error("Failed to fetch leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { employeeId, startDate, endDate, reason } = body;

    if (!employeeId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "employeeId, startDate, endDate, and reason are required" },
        { status: 400 }
      );
    }

    // Server-side date validation
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startDateObj < today) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    if (endDateObj < startDateObj) {
      return NextResponse.json(
        { error: "End date must be on or after start date" },
        { status: 400 }
      );
    }

    const leaveDuration = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (leaveDuration > 30) {
      return NextResponse.json(
        { error: "Leave duration cannot exceed 30 days" },
        { status: 400 }
      );
    }

    if (reason.trim().length < 5 || reason.trim().length > 500) {
      return NextResponse.json(
        { error: "Reason must be between 5 and 500 characters" },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check sufficient leave balance
    if (employee.leaveBalance < leaveDuration) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Available: ${employee.leaveBalance} days, Requested: ${leaveDuration} days` },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests (PENDING or APPROVED)
    const existingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      },
      select: { startDate: true, endDate: true },
    });

    const hasOverlap = existingLeaves.some((leave) => {
      const existingStart = new Date(leave.startDate);
      const existingEnd = new Date(leave.endDate);
      return startDateObj <= existingEnd && endDateObj >= existingStart;
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: "This leave request overlaps with an existing pending or approved leave" },
        { status: 409 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: { employeeId, startDate, endDate, reason },
    });

    ActivityLogger.leave.created(employee.name, leaveRequest.id, startDate, endDate);

    return NextResponse.json(
      { data: serialize(leaveRequest) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create leave request:", error);
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}
