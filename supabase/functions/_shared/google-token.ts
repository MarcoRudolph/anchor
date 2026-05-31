/**
 * Google token lifecycle module (ADR-0008 / DEC-0008).
 *
 * FREEZE ARTIFACT — surface frozen in Phase 0; calendar logic is Phase 2.
 *
 * Provides:
 *  - encryptRefreshToken(plain): AES-256-GCM envelope encryption of the refresh token.
 *    The master key is read from env (GOOGLE_TOKEN_MASTER_KEY — 32-byte hex string).
 *    Returns a base64-encoded ciphertext: <iv_hex>:<ciphertext_base64>
 *
 *  - decryptRefreshToken(ciphertext): Reverses encryptRefreshToken. Returns the plaintext.
 *
 *  - buildReConsentUrl(clientId, redirectUri): Builds the Google OAuth re-consent URL
 *    with access_type=offline&prompt=consent and scope=calendar.events.
 *
 *  - markDisconnectedExternal(anchorUserId, db): Transitions connection_state from
 *    connected → disconnected_external (lazy revocation detection, ADR-0008).
 *
 * SECURITY INVARIANTS (T-00-17):
 *  - Cleartext refresh tokens MUST never be logged or persisted beyond this module.
 *  - Access tokens are NEVER persisted — this module only handles refresh tokens.
 *  - The master key is read from env at call time (not at module load) to avoid
 *    top-level Deno.env.get() crashes when imported in Node (Pitfall A).
 *
 * RUNTIME PORTABILITY (Pitfall B):
 *  Uses Web Crypto API (globalThis.crypto.subtle) which is available in:
 *   - Deno (prod edge functions)
 *   - Node >= 18 (Vitest tests)
 *  No Deno-specific APIs are used at module level.
 */

import { env } from "./env.ts";

// Google OAuth scope for calendar events (ADR-0008 — single scope, never broader)
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

// ---------------------------------------------------------------------------
// Key derivation helpers
// ---------------------------------------------------------------------------

/**
 * Derives a CryptoKey from the hex-encoded 32-byte master key in env.
 * Called at encrypt/decrypt time (not at import time) for runtime portability.
 */
async function getMasterKey(): Promise<CryptoKey> {
  const masterKeyHex = env("GOOGLE_TOKEN_MASTER_KEY");
  if (!masterKeyHex || masterKeyHex.length < 32) {
    throw new Error(
      "[google-token] GOOGLE_TOKEN_MASTER_KEY is not set or too short. " +
        "Expected a 32-byte hex string (64 hex chars)."
    );
  }

  // Accept either a 32-byte hex string (64 chars) or a 64-byte hex (128 chars);
  // use only the first 32 bytes (256 bits) for AES-256.
  const hexKey = masterKeyHex.slice(0, 64).padEnd(64, "0");
  const keyBytes = new Uint8Array(
    hexKey.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  );

  return await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ---------------------------------------------------------------------------
// Envelope encryption / decryption
// ---------------------------------------------------------------------------

/**
 * Encrypts a Google refresh token using AES-256-GCM.
 *
 * Returns a string in the format: "<iv_base64>:<ciphertext_base64>"
 * This string is safe to store in the google_connection.refresh_token_encrypted column.
 *
 * @param plaintext - The raw Google refresh token (never log this value).
 */
export async function encryptRefreshToken(plaintext: string): Promise<string> {
  const key = await getMasterKey();

  // Generate a random 96-bit (12-byte) IV — required by AES-GCM
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12)) as Uint8Array;

  const encoder = new TextEncoder();
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const ivBase64 = uint8ArrayToBase64(iv);
  const cipherBase64 = uint8ArrayToBase64(new Uint8Array(cipherBuffer));

  return `${ivBase64}:${cipherBase64}`;
}

/**
 * Decrypts an AES-256-GCM encrypted refresh token.
 *
 * Accepts the format produced by encryptRefreshToken: "<iv_base64>:<ciphertext_base64>"
 * Returns the plaintext refresh token.
 *
 * @param ciphertext - The encrypted token string from the DB column.
 */
export async function decryptRefreshToken(ciphertext: string): Promise<string> {
  const colonIdx = ciphertext.indexOf(":");
  if (colonIdx === -1) {
    throw new Error("[google-token] Invalid ciphertext format (missing ':' separator)");
  }

  const ivBase64 = ciphertext.slice(0, colonIdx);
  const cipherBase64 = ciphertext.slice(colonIdx + 1);

  const iv = base64ToUint8Array(ivBase64);
  const cipherBuffer = base64ToUint8Array(cipherBase64);

  const key = await getMasterKey();

  const plaintextBuffer = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

// ---------------------------------------------------------------------------
// Re-consent URL builder (ADR-0008)
// ---------------------------------------------------------------------------

/**
 * Builds a Google OAuth re-consent URL that forces Google to issue a fresh
 * refresh token (access_type=offline&prompt=consent).
 *
 * Per ADR-0008: used in the Re-Consent Flow when connection_state is
 * disconnected_external. The same single scope (calendar.events) is requested.
 *
 * @param clientId   - Google OAuth client ID
 * @param redirectUri - OAuth redirect URI (must match the Google Console config)
 */
export function buildReConsentUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Connection state transitions (ADR-0008 lazy revocation detection)
// ---------------------------------------------------------------------------

export type GoogleConnectionState = "connected" | "disconnected_external" | "revoked";

/**
 * Transitions a user's Google connection state to disconnected_external.
 *
 * Called when a Calendar API call returns invalid_grant or 401 (lazy detection).
 * The db parameter is left intentionally typed as `unknown` so this module
 * compiles in Node tests without a Drizzle/Postgres import.
 *
 * Wave 2 replaces the stub body with a real DB update:
 *   await db.update(googleConnection)
 *     .set({ connectionState: 'disconnected_external', disconnectedAt: new Date().toISOString() })
 *     .where(eq(googleConnection.anchorUserId, anchorUserId));
 *
 * @param anchorUserId - The anchor_user.id whose Google connection to mark
 * @param db           - Drizzle DB instance (service-role, bypasses RLS) — stub param
 */
export async function markDisconnectedExternal(
  anchorUserId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
): Promise<void> {
  // STUB: Wave 2 replaces with real DB write
  void anchorUserId;
  void db;
  // Real implementation:
  // await db.update(googleConnection)
  //   .set({ connectionState: 'disconnected_external', disconnectedAt: new Date().toISOString() })
  //   .where(eq(googleConnection.anchorUserId, anchorUserId));
}

// ---------------------------------------------------------------------------
// Uint8Array ↔ base64 helpers (browser/Deno/Node compatible)
// ---------------------------------------------------------------------------

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
