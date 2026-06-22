import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize, serializeArray } from "@/lib/serialize";
import { LeaveStatus } from "@prisma/client";
import { ActivityLogger } from "@/lib/activity-logger";

export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json();
    const { employeeId, startDate, endDate, reason } = body;

    if (!employeeId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "employeeId, startDate, endDate, and reason are required" },
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
