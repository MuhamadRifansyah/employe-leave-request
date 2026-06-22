"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { Sidebar, TopNavbar, NavbarProvider, useSidebar } from "@/components/shared/navbar";
import { cn } from "@/lib/utils";

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "md:ml-[68px]" : "md:ml-60"
      )}>
        <TopNavbar />
        <main className="flex-1 gradient-mesh">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <NavbarProvider>
        <ProtectedContent>{children}</ProtectedContent>
      </NavbarProvider>
    </AuthGuard>
  );
}
