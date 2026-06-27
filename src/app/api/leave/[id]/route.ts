import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { LeaveStatus } from "@prisma/client";
import { ActivityLogger } from "@/lib/activity-logger";
import { requireAuth, requireRole } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            name: true,
            department: true,
            leaveBalance: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    const { employee, ...rest } = leaveRequest;
    return NextResponse.json({ data: { ...serialize(rest), employee } });
  } catch (error) {
    console.error("Failed to fetch leave request:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            leaveBalance: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    // Status update
    if (body.status) {
      const { status } = body;

      // Approve/Reject requires ADMIN or MANAGER role
      if (status === LeaveStatus.APPROVED || status === LeaveStatus.REJECTED) {
        if (!['ADMIN', 'MANAGER'].includes(auth.role)) {
          return NextResponse.json(
            { error: "Only admins and managers can approve or reject leave requests" },
            { status: 403 }
          );
        }
      }

      if (existing.status !== LeaveStatus.PENDING) {
        return NextResponse.json(
          { error: "This request has already been processed" },
          { status: 400 }
        );
      }

      if (
        ![
          LeaveStatus.APPROVED,
          LeaveStatus.REJECTED,
          LeaveStatus.CANCELLED,
        ].includes(status)
      ) {
        return NextResponse.json(
          { error: "Invalid status transition" },
          { status: 400 }
        );
      }

      if (status === LeaveStatus.APPROVED) {
        const duration =
          Math.ceil(
            (new Date(existing.endDate).getTime() -
              new Date(existing.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        if (existing.employee.leaveBalance < duration) {
          return NextResponse.json(
            {
              error: `Insufficient leave balance (${existing.employee.leaveBalance} days available, ${duration} days requested)`,
            },
            { status: 400 }
          );
        }

        const [updatedRequest] = await prisma.$transaction([
          prisma.leaveRequest.update({
            where: { id },
            data: {
              status: LeaveStatus.APPROVED,
              reviewedBy: auth.userId,
              reviewedAt: new Date(),
            },
          }),
          prisma.employee.update({
            where: { id: existing.employee.id },
            data: { leaveBalance: { decrement: duration } },
          }),
        ]);

        ActivityLogger.leave.approved(existing.employee.name, id);

        return NextResponse.json({ data: serialize(updatedRequest) });
      }

      // REJECTED or CANCELLED
      const updatedRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: status as LeaveStatus,
          ...(status === LeaveStatus.REJECTED && {
            rejectionReason: body.rejectionReason || null,
            reviewedBy: auth.userId,
            reviewedAt: new Date(),
          }),
        },
      });

      if (status === LeaveStatus.REJECTED) {
        ActivityLogger.leave.rejected(existing.employee.name, id);
      } else {
        ActivityLogger.leave.cancelled(existing.employee.name, id);
      }
      return NextResponse.json({ data: serialize(updatedRequest) });
    }

    // Field edit - only ADMIN/MANAGER can edit
    if (body.startDate || body.endDate || body.reason) {
      if (!['ADMIN', 'MANAGER'].includes(auth.role)) {
        return NextResponse.json(
          { error: "Only admins and managers can edit leave requests" },
          { status: 403 }
        );
      }

      if (existing.status !== LeaveStatus.PENDING) {
        return NextResponse.json(
          { error: "Only pending requests can be edited" },
          { status: 400 }
        );
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          ...(body.startDate && { startDate: body.startDate }),
          ...(body.endDate && { endDate: body.endDate }),
          ...(body.reason && { reason: body.reason }),
        },
      });

      return NextResponse.json({ data: serialize(updatedRequest) });
    }

    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireRole(request, ["ADMIN"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            leaveBalance: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    if (existing.status === LeaveStatus.APPROVED) {
      // Restore leave balance before deleting
      const duration =
        Math.ceil(
          (new Date(existing.endDate).getTime() -
            new Date(existing.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      await prisma.$transaction([
        prisma.employee.update({
          where: { id: existing.employee.id },
          data: { leaveBalance: { increment: duration } },
        }),
        prisma.leaveRequest.delete({
          where: { id },
        }),
      ]);
    } else {
      // PENDING, REJECTED, or CANCELLED — just delete
      await prisma.leaveRequest.delete({
        where: { id },
      });
    }

    ActivityLogger.leave.deleted(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete leave request:", error);
    return NextResponse.json(
      { error: "Failed to delete leave request" },
      { status: 500 }
    );
  }
}
