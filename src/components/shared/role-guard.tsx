"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { RoleName } from "@/constants";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: RoleName[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!role || !allowedRoles.includes(role)) {
      router.replace("/dashboard?error=unauthorized");
    } else {
      setAuthorized(true);
    }
  }, [role, isLoading, allowedRoles, router]);

  if (isLoading || !authorized) {
    return null;
  }

  return <>{children}</>;
}
