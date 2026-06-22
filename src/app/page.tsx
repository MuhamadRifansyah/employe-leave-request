"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/services/auth-storage";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      await authStorage.initialize();
      if (authStorage.isAuthenticated()) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
    redirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
