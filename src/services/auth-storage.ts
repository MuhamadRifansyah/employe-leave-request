import type { AuthSession, AuthUser, LoginResult } from "@/types";
import { verifyPassword } from "@/lib/auth";
import {
  saveSession,
  getSession,
  clearSession,
  isAuthenticated,
  createExpiryTimestamp,
} from "@/lib/session";
import { userStorage, initializeSeedUsers } from "@/services/user-storage";

/**
 * Authentication service.
 * Handles login, logout, and session management with role-based access.
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
   * Authenticate a user with username and password.
   * Returns a LoginResult with session data on success.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    await initializeSeedUsers();

    const user = userStorage.getByUsername(username);

    if (!user) {
      return { success: false, session: null, error: "Invalid credentials" };
    }

    if (!user.isActive) {
      return {
        success: false,
        session: null,
        error: "Account is deactivated. Contact your administrator.",
      };
    }

    const isValid = await verifyPassword(
      password,
      user.passwordHash,
      user.salt
    );

    if (!isValid) {
      return { success: false, session: null, error: "Invalid credentials" };
    }

    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      isAuthenticated: true,
      loginAt: new Date().toISOString(),
      expiresAt: createExpiryTimestamp(),
    };

    saveSession(session);
    return { success: true, session };
  },

  /**
   * Log out the current user. Clears both localStorage and cookie.
   */
  logout(): void {
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
