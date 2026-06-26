import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
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

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: serialize(employee) });
  } catch (error) {
    console.error("Failed to fetch employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireRole(request, ["ADMIN"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();
    const { name, department, position } = body;

    // Validate fields if provided
    const validationErrors: string[] = [];
    if (name !== undefined) {
      const trimmed = typeof name === "string" ? name.trim() : "";
      if (trimmed.length < 3) validationErrors.push("Name must be at least 3 characters");
      if (trimmed.length > 100) validationErrors.push("Name must not exceed 100 characters");
    }
    if (department !== undefined) {
      const trimmed = typeof department === "string" ? department.trim() : "";
      if (trimmed.length < 1) validationErrors.push("Department is required");
      if (trimmed.length > 100) validationErrors.push("Department must not exceed 100 characters");
    }
    if (position !== undefined) {
      const trimmed = typeof position === "string" ? position.trim() : "";
      if (trimmed.length < 1) validationErrors.push("Position is required");
      if (trimmed.length > 100) validationErrors.push("Position must not exceed 100 characters");
    }
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join("; ") },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(department !== undefined && { department: department.trim() }),
        ...(position !== undefined && { position: position.trim() }),
      },
    });

    ActivityLogger.employee.updated(employee.name, employee.id, { name, department, position });

    return NextResponse.json({ data: serialize(employee) });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
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

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    await prisma.employee.delete({
      where: { id },
    });

    ActivityLogger.employee.deleted(existing.name, existing.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
