"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/services/auth-storage";
import type { RoleName } from "@/constants";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        await authStorage.initialize();
        const session = authStorage.getSession();

        if (!session || !session.isAuthenticated) {
          router.replace("/login");
          return;
        }

        // If specific roles are required, check them
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(session.role)) {
            router.replace("/dashboard?error=unauthorized");
            return;
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/login?error=session");
      }
    }
    check();
  }, [router, allowedRoles]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
