import type { AuthUser } from "@/types";
import { storage } from "@/lib/storage";
import { generateId } from "@/lib/utils";
// Password hashing removed — auth is now server-side
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
const SEED_VERSION = "3"; // Bumped: auth is now server-side, no password hashes stored

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
  }

  const now = new Date().toISOString();
  const users: AuthUser[] = [];

  for (const seed of SEED_USERS) {
    users.push({
      id: generateId(),
      username: seed.username,
      email: seed.email,
      role: seed.role,
      displayName: seed.displayName,
      passwordHash: '', // Auth is now server-side
      salt: '',
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

    const now = new Date().toISOString();

    const newUser: AuthUser = {
      id: generateId(),
      username: data.username,
      email: data.email,
      role: data.role,
      displayName: data.displayName,
      passwordHash: '', // Auth is now server-side
      salt: '',
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

  async updatePassword(_id: string, _newPassword: string): Promise<boolean> {
    // Password management is now server-side
    // This method is kept for interface compatibility but is a no-op
    return false;
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
