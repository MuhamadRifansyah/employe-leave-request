import { NextRequest, NextResponse } from "next/server";
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, userName } = body;

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    if (action === "LOGIN") {
      await ActivityLogger.auth.login(userId, userName, ip);
    } else if (action === "LOGOUT") {
      await ActivityLogger.auth.logout(userId, userName);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log auth activity:", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
