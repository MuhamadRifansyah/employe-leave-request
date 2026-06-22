import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, ROUTE_PERMISSIONS } from "@/constants";
import type { RoleName } from "@/constants";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/report"];

function parseAuthCookie(
  cookieValue: string
): { userId: string; role: string; expiresAt: string } | null {
  try {
    const decoded = atob(cookieValue);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function findMatchingRoute(pathname: string): string | null {
  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) return pathname;

  // Check prefix matches (most specific first)
  const sortedRoutes = Object.keys(ROUTE_PERMISSIONS).sort(
    (a, b) => b.length - a.length
  );
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route + "/") || pathname === route) {
      return route;
    }
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    )
  ) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!authCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = parseAuthCookie(authCookie.value);

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // Check session expiry
  if (new Date(session.expiresAt) < new Date()) {
    const response = NextResponse.redirect(
      new URL("/login?error=expired", request.url)
    );
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // Check role-based access
  const matchedRoute = findMatchingRoute(pathname);
  if (matchedRoute) {
    const allowedRoles = ROUTE_PERMISSIONS[matchedRoute];
    if (allowedRoles && !allowedRoles.includes(session.role as RoleName)) {
      return NextResponse.redirect(
        new URL("/dashboard?error=unauthorized", request.url)
      );
    }
  }

  // Redirect authenticated users from root to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
