import { NextRequest, NextResponse } from "next/server";

export interface AuthContext {
  userId: string;
  role: string;
}

export function getAuthContext(request: NextRequest): AuthContext | null {
  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role");
  if (!userId || !role) return null;
  return { userId, role };
}

export function requireAuth(request: NextRequest): AuthContext | NextResponse {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  return auth;
}

export function requireRole(request: NextRequest, roles: string[]): AuthContext | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  return result;
}
