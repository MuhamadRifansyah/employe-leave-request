import type { AuthSession, AuthUser, LoginResult } from "@/types";
import {
  saveSession,
  getSession,
  clearSession,
  isAuthenticated,
} from "@/lib/session";
import { userStorage, initializeSeedUsers } from "@/services/user-storage";

/**
 * Authentication service.
 * Handles login, logout, and session management with role-based access.
 * Auth verification is performed server-side; the client only stores display data.
 */
export const authStorage = {
  /**
   * Initialize the auth system. Must be called once on app load.
   * Seeds default users (admin, manager, employee) if none exist.
   */
  async initialize(): Promise<void> {
    await initializeSeedUsers();
  },

  /**
   * Authenticate a user via the server API.
   * The server sets an HttpOnly cookie; we save display data to localStorage.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, session: null, error: data.error || 'Invalid credentials' };
      }

      const user = await response.json();

      // Cookie is set by server (HttpOnly), just save display data to localStorage
      const session: AuthSession = {
        userId: user.userId,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        isAuthenticated: true,
        loginAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      saveSession(session);
      return { success: true, session };
    } catch {
      return { success: false, session: null, error: 'Network error. Please try again.' };
    }
  },

  /**
   * Log out the current user. Calls server to clear HttpOnly cookie,
   * then clears localStorage session data.
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    }
    clearSession();
  },

  /**
   * Get the current session (or null if expired/missing).
   */
  getSession,

  /**
   * Check if the current user is authenticated.
   */
  isAuthenticated,

  /**
   * Get the current user's full data from storage.
   */
  getCurrentUser(): AuthUser | null {
    const session = getSession();
    if (!session) return null;
    return userStorage.getById(session.userId) ?? null;
  },
};
