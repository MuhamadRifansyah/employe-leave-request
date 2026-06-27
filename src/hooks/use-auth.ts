"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/services/auth-storage";
import type { AuthSession } from "@/types";
import type { RoleName } from "@/constants";
import { ROLES } from "@/constants";

export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await authStorage.initialize();
      const currentSession = authStorage.getSession();
      setSession(currentSession);
      setIsLoading(false);
    }
    init();
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await authStorage.login(username, password);
      if (result.success && result.session) {
        setSession(result.session);
        // Log login activity (fire-and-forget)
        fetch("/api/activity/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "LOGIN", userId: result.session.userId, userName: result.session.displayName }),
        }).catch(() => {});
        router.push("/dashboard");
      }
      return { success: result.success, error: result.error };
    },
    [router]
  );

  const logout = useCallback(async () => {
    // Log logout activity (fire-and-forget)
    if (session) {
      fetch("/api/activity/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOGOUT", userId: session.userId, userName: session.displayName }),
      }).catch(() => {});
    }
    await authStorage.logout();
    setSession(null);
    router.push("/login");
  }, [router, session]);

  /**
   * Check if the current user has one of the specified roles.
   */
  const hasRole = useCallback(
    (...roles: RoleName[]): boolean => {
      if (!session) return false;
      return roles.includes(session.role);
    },
    [session]
  );

  const isAdmin = useMemo(() => session?.role === ROLES.ADMIN, [session]);

  const isManager = useMemo(() => session?.role === ROLES.MANAGER, [session]);

  const isEmployee = useMemo(
    () => session?.role === ROLES.EMPLOYEE,
    [session]
  );

  return {
    session,
    isAuthenticated: session?.isAuthenticated ?? false,
    isLoading,
    login,
    logout,
    hasRole,
    isAdmin,
    isManager,
    isEmployee,
    role: session?.role ?? null,
  };
}
