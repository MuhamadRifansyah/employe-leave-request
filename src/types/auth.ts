import type { RoleName } from "@/constants";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: RoleName;
  displayName: string;
  passwordHash: string;
  salt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  userId: string;
  username: string;
  role: RoleName;
  displayName: string;
  isAuthenticated: boolean;
  loginAt: string;
  expiresAt: string;
};

export type LoginResult = {
  success: boolean;
  session: AuthSession | null;
  error?: string;
};
