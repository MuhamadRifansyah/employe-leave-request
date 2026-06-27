import { NextRequest, NextResponse } from "next/server";
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, userName } = body;

    // Validate action is a known enum value
    if (action !== "LOGIN" && action !== "LOGOUT") {
      return NextResponse.json({ error: "Invalid action. Must be LOGIN or LOGOUT." }, { status: 400 });
    }

    // Validate userId is a non-empty string
    if (typeof userId !== "string" || userId.trim().length === 0) {
      return NextResponse.json({ error: "userId is required and must be a non-empty string." }, { status: 400 });
    }

    // Validate userName is a non-empty string
    if (typeof userName !== "string" || userName.trim().length === 0) {
      return NextResponse.json({ error: "userName is required and must be a non-empty string." }, { status: 400 });
    }

    // Sanitize userName: trim, cap length, strip HTML tags to prevent XSS
    const sanitizedUserName = userName
      .trim()
      .slice(0, 100)
      .replace(/<[^>]*>/g, "");

    const sanitizedUserId = userId.trim();

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    if (action === "LOGIN") {
      await ActivityLogger.auth.login(sanitizedUserId, sanitizedUserName, ip);
    } else {
      await ActivityLogger.auth.logout(sanitizedUserId, sanitizedUserName);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log auth activity:", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
