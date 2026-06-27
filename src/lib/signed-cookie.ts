/**
 * HMAC-SHA256 cookie signing / verification utility.
 *
 * Uses the Web Crypto API (`crypto.subtle`) so it works in BOTH
 * the Edge runtime (proxy) and the Node.js runtime (API routes).
 */

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "employee-leave-system-default-secret-change-in-production";

/**
 * Sign a JSON payload and return a `<base64-payload>.<base64-sig>` token.
 */
export async function signPayload(payload: object): Promise<string> {
  const json = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(json));

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(encoded));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return `${encoded}.${sigBase64}`;
}

/**
 * Verify an HMAC-signed token and return the decoded payload, or `null`
 * if the token is missing, malformed, or has an invalid signature.
 */
export async function verifyPayload<T = unknown>(
  token: string,
): Promise<T | null> {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(AUTH_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(encoded),
    );
    if (!valid) return null;

    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
