"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authStorage } from "@/services/auth-storage";
import { saveSession } from "@/lib/session";
import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_WARNING_THRESHOLD_MS,
} from "@/constants";

/**
 * Hook that manages session lifecycle:
 * 
 * 1. **Expiry monitoring** — Checks session expiry every 30s.
 *    Shows a warning toast 5 minutes before expiry.
 *    Auto-redirects to login when expired.
 * 
 * 2. **Idle detection** — Tracks user activity (mouse, keyboard, touch, scroll).
 *    If the user is idle for 30 minutes, auto-logout with a message.
 * 
 * 3. **Session extension** — Active users get their session extended
 *    when they perform an action and the session is within 1 hour of expiry.
 * 
 * 4. **Multi-tab sync** — Listens for storage events so logout in one tab
 *    propagates to all tabs.
 */
export function useSessionManager() {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const isLoggedOutRef = useRef(false);

  /**
   * Force logout and redirect to login page.
   */
  const forceLogout = useCallback(
    (reason: "expired" | "idle") => {
      if (isLoggedOutRef.current) return;
      isLoggedOutRef.current = true;

      authStorage.logout();

      if (reason === "expired") {
        toast.error("Session expired", {
          description: "Your session has expired. Please log in again.",
          duration: 5000,
        });
        router.replace("/login?error=expired");
      } else {
        toast.warning("Logged out due to inactivity", {
          description: "You were inactive for too long. Please log in again.",
          duration: 5000,
        });
        router.replace("/login?error=idle");
      }
    },
    [router]
  );

  /**
   * Extend the session if the user is active and session is close to expiry.
   */
  const extendSessionIfNeeded = useCallback(() => {
    const session = authStorage.getSession();
    if (!session) return;

    const expiresAt = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // If within 1 hour of expiry and user is active, extend the session
    const ONE_HOUR = 60 * 60 * 1000;
    if (timeUntilExpiry > 0 && timeUntilExpiry < ONE_HOUR) {
      const newExpiresAt = new Date(
        now + 24 * 60 * 60 * 1000
      ).toISOString();
      const updatedSession = { ...session, expiresAt: newExpiresAt };
      saveSession(updatedSession);
      warningShownRef.current = false;
    }
  }, []);

  /**
   * Record user activity and potentially extend session.
   */
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    extendSessionIfNeeded();
  }, [extendSessionIfNeeded]);

  /**
   * Check session health: expiry + idle timeout.
   */
  const checkSession = useCallback(() => {
    if (isLoggedOutRef.current) return;

    const session = authStorage.getSession();
    if (!session || !session.isAuthenticated) {
      forceLogout("expired");
      return;
    }

    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;

    // Session expired
    if (timeUntilExpiry <= 0) {
      forceLogout("expired");
      return;
    }

    // Show warning before expiry
    if (
      timeUntilExpiry <= SESSION_WARNING_THRESHOLD_MS &&
      !warningShownRef.current
    ) {
      warningShownRef.current = true;
      const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
      toast.warning(`Session expiring soon`, {
        description: `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}. Stay active to extend it.`,
        duration: 10000,
      });
    }

    // Idle timeout check
    const idleTime = now - lastActivityRef.current;
    if (idleTime >= SESSION_IDLE_TIMEOUT_MS) {
      forceLogout("idle");
      return;
    }
  }, [forceLogout]);

  useEffect(() => {
    // Reset state on mount
    isLoggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // Activity tracking events
    const activityEvents = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ] as const;

    // Throttle activity recording (max once per 30 seconds)
    let lastRecorded = 0;
    const throttledRecord = () => {
      const now = Date.now();
      if (now - lastRecorded > 30000) {
        lastRecorded = now;
        recordActivity();
      }
      // Always update lastActivity for idle detection
      lastActivityRef.current = now;
    };

    for (const event of activityEvents) {
      window.addEventListener(event, throttledRecord, { passive: true });
    }

    // Session check interval (every 30 seconds)
    const intervalId = setInterval(checkSession, 30000);

    // Multi-tab sync: listen for storage changes (logout in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "authSession" && e.newValue === null) {
        // Session was cleared in another tab
        isLoggedOutRef.current = true;
        router.replace("/login");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      for (const event of activityEvents) {
        window.removeEventListener(event, throttledRecord);
      }
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
    };
  }, [checkSession, recordActivity, router]);
}
