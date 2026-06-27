import { NextResponse } from "next/server";
import { signPayload } from "@/lib/signed-cookie";
import { prisma } from "@/lib/prisma";

/**
 * Seed user definitions — mirrors the list in `src/services/user-storage.ts`.
 *
 * For this demo app the plaintext passwords are already visible in the source
 * code, so comparing them directly on the server side is acceptable.  In a
 * production system you would store bcrypt / argon2 hashes in the database and
 * verify against those instead.
 */
const SEED_USERS = [
  {
    username: "admin",
    email: "admin@leavely.app",
    role: "ADMIN",
    displayName: "Admin User",
    password: "admin123",
  },
  {
    username: "manager",
    email: "manager@leavely.app",
    role: "MANAGER",
    displayName: "Siti Rahayu",
    password: "manager123",
  },
  {
    username: "employee",
    email: "employee@leavely.app",
    role: "EMPLOYEE",
    displayName: "Ahmad Fauzi",
    password: "employee123",
  },
] as const;

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 },
    );
  }

  const user = SEED_USERS.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  // Deterministic user ID based on username for consistency across sessions
  const userId = `user-${user.username}`;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const payload = {
    userId,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    expiresAt,
  };

  const token = await signPayload(payload);

  const response = NextResponse.json({
    userId,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    email: user.email,
  });

  response.cookies.set("auth_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 86400,
  });

  // Log login activity (best-effort — don't block the response on failure)
  try {
    await prisma.activityLog.create({
      data: {
        action: "LOGIN",
        category: "AUTH",
        description: `${user.displayName} logged in`,
        userId,
        userName: user.displayName,
      },
    });
  } catch (e) {
    console.error("Failed to log login activity:", e);
  }

  return response;
}
