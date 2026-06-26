// Storage keys
export const STORAGE_KEYS = {
  AUTH_SESSION: "authSession",
  USERS: "users",
  EMPLOYEES: "employees",
  LEAVE_REQUESTS: "leaveRequests",
} as const;

// Role definitions
export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Role display labels
export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

// Route permissions — which roles can access which routes
export const ROUTE_PERMISSIONS: Record<string, RoleName[]> = {
  // All roles
  "/dashboard": ["ADMIN", "MANAGER", "EMPLOYEE"],

  // Admin only
  "/employees": ["ADMIN"],
  "/employees/new": ["ADMIN"],
  "/employees/edit": ["ADMIN"],
  "/reports": ["ADMIN"],
  "/activity": ["ADMIN"],

  // Admin + Manager
  "/leave": ["ADMIN", "MANAGER"],
  "/leave/new": ["ADMIN", "MANAGER"],
  "/leave/edit": ["ADMIN", "MANAGER", "EMPLOYEE"],

  // Employee only
  "/my-leave": ["EMPLOYEE", "MANAGER"],
  "/my-leave/new": ["EMPLOYEE", "MANAGER"],
  "/profile": ["EMPLOYEE", "MANAGER"],
};

// Session duration: 24 hours
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const AUTH_COOKIE_NAME = "auth_session";

// Default leave balance per year
export const DEFAULT_LEAVE_BALANCE = 12;

// Maximum page size for "fetch all" queries
export const MAX_PAGE_SIZE = 1000;
