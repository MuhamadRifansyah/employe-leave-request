/**
 * Password hashing utilities using PBKDF2 via Web Crypto API.
 * PBKDF2 is preferred over raw SHA-256 for password hashing because
 * it uses key stretching (100,000 iterations) to resist brute-force attacks.
 */

const PBKDF2_ITERATIONS = 100_000;
const HASH_ALGORITHM = "SHA-256";
const KEY_LENGTH = 256;

/**
 * Generate a cryptographically secure random salt.
 */
export function generateSalt(): string {
  const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(saltBuffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash a password using PBKDF2 with the given salt.
 */
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const saltBuffer = encoder.encode(salt);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a password against a stored hash and salt.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}
