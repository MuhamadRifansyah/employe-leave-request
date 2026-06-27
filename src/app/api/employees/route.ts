import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize, serializeArray } from "@/lib/serialize";
import { ActivityLogger } from "@/lib/activity-logger";
import { requireAuth, requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    // Clamp values
    const safePage = Math.max(1, isNaN(page) ? 1 : page);
    const safePageSize = Math.min(Math.max(1, isNaN(pageSize) ? 10 : pageSize), 100);
    const skip = (safePage - 1) * safePageSize;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { department: { contains: search, mode: "insensitive" as const } },
            { position: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / safePageSize);

    return NextResponse.json({
      data: serializeArray(employees),
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        totalCount,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ["ADMIN"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, department, position } = body;

    if (!name?.trim() || !department?.trim() || !position?.trim()) {
      return NextResponse.json(
        { error: "Name, department, and position are required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 3) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100 || department.trim().length > 100 || position.trim().length > 100) {
      return NextResponse.json(
        { error: "Fields must not exceed 100 characters" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        department: department.trim(),
        position: position.trim(),
      },
    });

    ActivityLogger.employee.created(employee.name, employee.id, auth.userId);

    return NextResponse.json({ data: serialize(employee) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
