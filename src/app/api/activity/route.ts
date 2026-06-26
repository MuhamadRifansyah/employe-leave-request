import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = requireRole(request, ["ADMIN"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const category = searchParams.get("category");
    const action = searchParams.get("action");
    const search = searchParams.get("search");

    const safePage = Math.max(1, isNaN(page) ? 1 : page);
    const safePageSize = Math.min(Math.max(1, isNaN(pageSize) ? 20 : pageSize), 100);
    const skip = (safePage - 1) * safePageSize;

    const where: Record<string, unknown> = {};

    if (category && category !== "ALL") {
      where.category = category;
    }
    if (action && action !== "ALL") {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { targetName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
      }),
      prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / safePageSize);

    const serializedLogs = logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data: serializedLogs,
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
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
