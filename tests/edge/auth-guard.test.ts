/**
 * Two-tier auth guard tests (Task 1 / DEC-0010 / T-00-14 / T-00-15).
 *
 * Proves the four rejection cases:
 *  1. User JWT presented to a Hermes-only verb is rejected (403).
 *  2. Service-role bearer WITHOUT x-hermes-secret is rejected (403).
 *  3. Missing user JWT is rejected (401).
 *  4. Valid user JWT (mocked) passes requireUser and returns anchorUserId.
 *
 * Cross-runtime note (Pitfall A):
 *   These tests run in Node via Vitest. The _shared modules use env() which
 *   falls back to process.env when Deno is not present.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireHermes, requireUser } from "../../supabase/functions/_shared/auth.ts";

// ---- env helpers ----
const SERVICE_ROLE_KEY = "test-service-role-key";
const HERMES_SECRET = "test-hermes-secret";
const SUPABASE_URL = "http://localhost:54321";
const ANON_KEY = "test-anon-key";
const VALID_USER_ID = "00000000-0000-7000-a000-000000000001";
const VALID_USER_JWT = "valid-user-jwt-token";

function setTestEnv() {
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  process.env.HERMES_SHARED_SECRET = HERMES_SECRET;
  process.env.SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = ANON_KEY;
}

function clearTestEnv() {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.HERMES_SHARED_SECRET;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
}

// ---- fetch mock ----
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setTestEnv();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  clearTestEnv();
  vi.unstubAllGlobals();
});

// ---- requireHermes tests ----

describe("requireHermes", () => {
  it("case 1: rejects a user JWT (no x-hermes-secret) with 403", () => {
    // Simulates a webapp user JWT calling a Hermes-only verb — must be rejected
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: {
        // A user JWT bearer (not the service-role key) and NO x-hermes-secret
        Authorization: `Bearer user-session-jwt`,
      },
    });

    expect(() => requireHermes(req)).toThrow();

    try {
      requireHermes(req);
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Response);
      expect((thrown as Response).status).toBe(403);
    }
  });

  it("case 2: rejects service-role bearer WITHOUT x-hermes-secret with 403", () => {
    // Service-role key present but missing the second factor (x-hermes-secret)
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        // x-hermes-secret intentionally omitted
      },
    });

    expect(() => requireHermes(req)).toThrow();

    try {
      requireHermes(req);
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Response);
      expect((thrown as Response).status).toBe(403);
    }
  });

  it("allows a valid hermes call (correct service-role + correct secret)", () => {
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "x-hermes-secret": HERMES_SECRET,
      },
    });

    // Should not throw
    expect(() => requireHermes(req)).not.toThrow();
  });

  it("rejects wrong x-hermes-secret even when service-role bearer is correct", () => {
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "x-hermes-secret": "wrong-secret",
      },
    });

    expect(() => requireHermes(req)).toThrow();

    try {
      requireHermes(req);
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Response);
      expect((thrown as Response).status).toBe(403);
    }
  });
});

// ---- requireUser tests ----

describe("requireUser", () => {
  it("case 3: rejects missing user JWT with 401", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-issue", {
      method: "POST",
      // No Authorization header
    });

    let thrown: unknown;
    try {
      await requireUser(req);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(401);
  });

  it("case 3b: rejects invalid user JWT (Supabase Auth returns non-ok) with 401", async () => {
    // Mock Supabase Auth to return 401 for an invalid JWT
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "invalid JWT" }), { status: 401 })
    );

    const req = new Request("http://localhost/functions/v1/pairing-issue", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-jwt",
      },
    });

    let thrown: unknown;
    try {
      await requireUser(req);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(401);
  });

  it("case 4: valid user JWT passes and returns anchorUserId", async () => {
    // Mock Supabase Auth to return a valid user for the JWT
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: VALID_USER_ID, email: "test@example.com" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const req = new Request("http://localhost/functions/v1/pairing-issue", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VALID_USER_JWT}`,
      },
    });

    const ctx = await requireUser(req);
    expect(ctx.anchorUserId).toBe(VALID_USER_ID);

    // Verify the fetch was called with the correct Supabase Auth endpoint
    expect(fetchMock).toHaveBeenCalledWith(
      `${SUPABASE_URL}/auth/v1/user`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${VALID_USER_JWT}`,
          apikey: ANON_KEY,
        }),
      })
    );
  });
});

// ---- Tier enforcement integration ----

describe("Tier enforcement: user JWT on Hermes verb is rejected", () => {
  it("requireHermes throws 403 when only a user JWT is provided (no hermes credentials)", () => {
    // This is T-00-14: user JWT reaching a Hermes-only verb
    const hermesReq = new Request(
      "http://localhost/functions/v1/memory-store",
      {
        method: "POST",
        headers: {
          // A realistic user JWT — but no service-role and no x-hermes-secret
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.sig`,
        },
      }
    );

    let thrown: unknown;
    try {
      requireHermes(hermesReq);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(403);
  });
});
