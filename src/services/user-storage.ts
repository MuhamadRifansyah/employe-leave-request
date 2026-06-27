import type { AuthUser } from "@/types";
import { storage } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { generateSalt, hashPassword } from "@/lib/auth";
import { STORAGE_KEYS, ROLES } from "@/constants";
import type { RoleName } from "@/constants";

/**
 * Seed user definitions.
 * Passwords are hashed via PBKDF2 on first app load.
 */
const SEED_USERS: {
  username: string;
  email: string;
  role: RoleName;
  displayName: string;
  password: string;
}[] = [
  {
    username: "admin",
    email: "admin@leavely.app",
    role: ROLES.ADMIN,
    displayName: "Admin User",
    password: "admin123",
  },
  {
    username: "manager",
    email: "manager@leavely.app",
    role: ROLES.MANAGER,
    displayName: "Siti Rahayu",
    password: "manager123",
  },
  {
    username: "employee",
    email: "employee@leavely.app",
    role: ROLES.EMPLOYEE,
    displayName: "Ahmad Fauzi",
    password: "employee123",
  },
];

/**
 * Initialize seed users if the users storage is empty.
 * Runs once on first app load, then cached.
 */
let seedInitialized = false;
const SEED_VERSION = "2"; // Bump this when seed user data changes

export async function initializeSeedUsers(): Promise<void> {
  if (seedInitialized) return;
  if (typeof window === "undefined") return;

  const currentVersion = storage.get<string>("seed_version", "0");
  const existing = storage.get<AuthUser[]>(STORAGE_KEYS.USERS, []);

  if (existing.length > 0 && currentVersion === SEED_VERSION) {
    seedInitialized = true;
    return;
  }

  // Clear stale data when seed version changes
  if (currentVersion !== SEED_VERSION) {
    storage.remove(STORAGE_KEYS.USERS);
    storage.remove(STORAGE_KEYS.AUTH_SESSION);
    // Clear auth cookie so user re-logs with updated data
    if (typeof document !== "undefined") {
      document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
    }
  }

  const now = new Date().toISOString();
  const users: AuthUser[] = [];

  for (const seed of SEED_USERS) {
    const salt = generateSalt();
    const hash = await hashPassword(seed.password, salt);

    users.push({
      id: generateId(),
      username: seed.username,
      email: seed.email,
      role: seed.role,
      displayName: seed.displayName,
      passwordHash: hash,
      salt,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  storage.set(STORAGE_KEYS.USERS, users);
  storage.set("seed_version", SEED_VERSION);
  seedInitialized = true;
}

function getAll(): AuthUser[] {
  return storage.get<AuthUser[]>(STORAGE_KEYS.USERS, []);
}

function saveAll(users: AuthUser[]): void {
  storage.set(STORAGE_KEYS.USERS, users);
}

export const userStorage = {
  getAll,

  getById(id: string): AuthUser | undefined {
    return getAll().find((u) => u.id === id);
  },

  getByUsername(username: string): AuthUser | undefined {
    return getAll().find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  },

  getByRole(role: RoleName): AuthUser[] {
    return getAll().filter((u) => u.role === role);
  },

  async create(data: {
    username: string;
    email: string;
    password: string;
    role: RoleName;
    displayName: string;
  }): Promise<AuthUser> {
    const users = getAll();

    if (
      users.some(
        (u) => u.username.toLowerCase() === data.username.toLowerCase()
      )
    ) {
      throw new Error("Username already exists");
    }

    const salt = generateSalt();
    const hash = await hashPassword(data.password, salt);
    const now = new Date().toISOString();

    const newUser: AuthUser = {
      id: generateId(),
      username: data.username,
      email: data.email,
      role: data.role,
      displayName: data.displayName,
      passwordHash: hash,
      salt,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    saveAll(users);
    return newUser;
  },

  update(
    id: string,
    data: Partial<Pick<AuthUser, "email" | "displayName" | "role" | "isActive">>
  ): AuthUser | null {
    const users = getAll();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveAll(users);
    return users[index];
  },

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const users = getAll();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    const salt = generateSalt();
    const hash = await hashPassword(newPassword, salt);

    users[index] = {
      ...users[index],
      passwordHash: hash,
      salt,
      updatedAt: new Date().toISOString(),
    };
    saveAll(users);
    return true;
  },

  delete(id: string): boolean {
    const users = getAll();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) return false;
    saveAll(filtered);
    return true;
  },

  count(): number {
    return getAll().length;
  },
};
