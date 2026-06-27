"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROLE_LABELS, ROLES } from "@/constants";
import type { RoleName } from "@/constants";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  LogOut,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  FileText,
  UserCircle,
  ClipboardList,
} from "lucide-react";
import { useState, createContext, useContext, useMemo } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: RoleName[];
};

const allNavItems: NavItem[] = [
  // All roles
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE] },

  // Admin only
  { label: "Employees", href: "/employees", icon: Users, roles: [ROLES.ADMIN] },

  // Admin + Manager
  { label: "Leave Requests", href: "/leave", icon: CalendarDays, roles: [ROLES.ADMIN, ROLES.MANAGER] },

  // Admin only
  { label: "Reports", href: "/reports", icon: FileText, roles: [ROLES.ADMIN] },

  // Admin only
  { label: "Activity Logs", href: "/activity", icon: ClipboardList, roles: [ROLES.ADMIN] },

  // Employee + Manager
  { label: "My Leave", href: "/my-leave", icon: CalendarDays, roles: [ROLES.EMPLOYEE, ROLES.MANAGER] },
  { label: "Profile", href: "/profile", icon: UserCircle, roles: [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.MANAGER] },
];

type SidebarContextType = { collapsed: boolean; setCollapsed: (v: boolean) => void };
const SidebarContext = createContext<SidebarContextType>({ collapsed: false, setCollapsed: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function TopNavbar() {
  const { logout, session, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const userRole = session?.role ?? ROLES.EMPLOYEE;
  const roleLabel = ROLE_LABELS[userRole] || "User";
  const displayName = session?.displayName || session?.username || "User";

  const navItems = useMemo(
    () => isLoading ? [] : allNavItems.filter((item) => item.roles.includes(userRole)),
    [userRole, isLoading]
  );

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/50">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Open navigation menu" />}
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex h-14 items-center px-5 border-b">
                  <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-base tracking-tight">Leavely</span>
                  </Link>
                </div>
                <nav className="px-3 py-4 space-y-0.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive rounded-xl"
                    onClick={() => { setMobileOpen(false); logout(); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium leading-none">{displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={logout}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const { session, isLoading } = useAuth();
  const userRole = session?.role ?? ROLES.EMPLOYEE;

  const navItems = useMemo(
    () => isLoading ? [] : allNavItems.filter((item) => item.roles.includes(userRole)),
    [userRole, isLoading]
  );

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar/80 backdrop-blur-xl z-30 transition-all duration-300 ease-in-out",
        collapsed ? "md:w-[68px]" : "md:w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className={cn(
            "font-semibold text-base tracking-tight transition-all duration-300 whitespace-nowrap",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            Leavely
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-full rounded-xl text-muted-foreground", collapsed ? "" : "justify-start gap-3 px-3")}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}

export function Navbar() {
  return null; // kept for backward compat, use Sidebar + TopNavbar
}
