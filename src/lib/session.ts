import type { AuthSession } from "@/types";
import { storage } from "@/lib/storage";
import { STORAGE_KEYS, AUTH_COOKIE_NAME, SESSION_DURATION_MS } from "@/constants";

/**
 * Session management utilities.
 * Uses localStorage for full client-side session data and cookies
 * for Next.js middleware route protection (server-side).
 */

/**
 * Save session to both localStorage and a cookie.
 */
export function saveSession(session: AuthSession): void {
  storage.set(STORAGE_KEYS.AUTH_SESSION, session);

  // Set a cookie for Next.js middleware (server-side route protection)
  if (typeof document !== "undefined") {
    const cookieValue = btoa(
      JSON.stringify({
        userId: session.userId,
        role: session.role,
        expiresAt: session.expiresAt,
      })
    );
    const expires = new Date(session.expiresAt).toUTCString();
    document.cookie = `${AUTH_COOKIE_NAME}=${cookieValue}; path=/; expires=${expires}; SameSite=Lax`;
  }
}

/**
 * Get the current session from localStorage.
 * Returns null if session is missing or expired.
 */
export function getSession(): AuthSession | null {
  const session = storage.get<AuthSession | null>(
    STORAGE_KEYS.AUTH_SESSION,
    null
  );
  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    clearSession();
    return null;
  }

  return session;
}

/**
 * Clear session from both localStorage and cookie.
 */
export function clearSession(): void {
  storage.remove(STORAGE_KEYS.AUTH_SESSION);

  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

/**
 * Check if a valid (non-expired) session exists.
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Create a new session expiry timestamp (24 hours from now).
 */
export function createExpiryTimestamp(): string {
  return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
}
