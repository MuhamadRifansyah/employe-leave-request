import type { AuthSession } from "@/types";
import { storage } from "@/lib/storage";
import { STORAGE_KEYS, SESSION_DURATION_MS } from "@/constants";

/**
 * Session management utilities.
 * Uses localStorage for client-side display data.
 * Auth cookies are HttpOnly and managed by the server.
 */

/**
 * Save session display data to localStorage.
 * The auth cookie is HttpOnly and set by the server.
 */
export function saveSession(session: AuthSession): void {
  storage.set(STORAGE_KEYS.AUTH_SESSION, session);
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
 * Clear session display data from localStorage.
 * The server logout API handles clearing the HttpOnly cookie.
 */
export function clearSession(): void {
  storage.remove(STORAGE_KEYS.AUTH_SESSION);
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
