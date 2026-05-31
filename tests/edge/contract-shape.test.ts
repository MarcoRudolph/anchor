/**
 * Contract shape tests (Task 2 / DEC-0010).
 *
 * Asserts that all 13 edge function stubs return responses that match
 * the contract types in _shared/contract.ts (which mirrors openapi.yaml).
 *
 * Also asserts the google-token module behaviors:
 *  - encryptRefreshToken / decryptRefreshToken round-trip
 *  - buildReConsentUrl includes access_type=offline&prompt=consent + calendar.events scope
 *
 * Cross-runtime note (Pitfall B):
 *   All stubs export a `handler(req)` function; Deno.serve is guarded and
 *   does NOT execute on import. These tests run in Node via Vitest.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- handler imports ----
import { handler as pairingIssue } from "../../supabase/functions/pairing-issue/index.ts";
import { handler as pairingRedeem } from "../../supabase/functions/pairing-redeem/index.ts";
import { handler as authResolveTelegram } from "../../supabase/functions/auth-resolve-telegram/index.ts";
import { handler as turnStart } from "../../supabase/functions/turn-start/index.ts";
import { handler as turnDeliver } from "../../supabase/functions/turn-deliver/index.ts";
import { handler as turnFail } from "../../supabase/functions/turn-fail/index.ts";
import { handler as planState } from "../../supabase/functions/plan-state/index.ts";
import { handler as calendarList } from "../../supabase/functions/calendar-list/index.ts";
import { handler as calendarAdd } from "../../supabase/functions/calendar-add/index.ts";
import { handler as memoryRecall } from "../../supabase/functions/memory-recall/index.ts";
import { handler as memoryStore } from "../../supabase/functions/memory-store/index.ts";
import { handler as diaryAppend } from "../../supabase/functions/diary-append/index.ts";
import { handler as hermesCacheInvalidate } from "../../supabase/functions/hermes-cache-invalidate/index.ts";

// ---- google-token imports ----
import {
  encryptRefreshToken,
  decryptRefreshToken,
  buildReConsentUrl,
  CALENDAR_SCOPE,
} from "../../supabase/functions/_shared/google-token.ts";

// ---- test constants ----
const SERVICE_ROLE_KEY = "test-service-role-key";
const HERMES_SECRET = "test-hermes-secret";
const SUPABASE_URL = "http://localhost:54321";
const ANON_KEY = "test-anon-key";
const VALID_USER_ID = "00000000-0000-7000-a000-000000000001";
const VALID_USER_JWT = "valid-user-jwt-token";
// 32-byte master key (64 hex chars) for AES-256-GCM tests
const TEST_MASTER_KEY = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";

const ANCHOR_USER_ID = "00000000-0000-7000-a000-000000000001";
const TURN_ID = "00000000-0000-7000-a000-000000000002";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY;
  process.env.HERMES_SHARED_SECRET = HERMES_SECRET;
  process.env.SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = ANON_KEY;
  process.env.GOOGLE_TOKEN_MASTER_KEY = TEST_MASTER_KEY;

  // Mock fetch to return a valid user for user-tier tests
  fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({ id: VALID_USER_ID, email: "test@example.com" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.HERMES_SHARED_SECRET;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.GOOGLE_TOKEN_MASTER_KEY;
  vi.unstubAllGlobals();
});

// ---- helpers ----

function hermesHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "x-hermes-secret": HERMES_SECRET,
    "Content-Type": "application/json",
  };
}

function userHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${VALID_USER_JWT}`,
    "Content-Type": "application/json",
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  return JSON.parse(text);
}

// ---- USER-TIER stubs ----

describe("pairing-issue (user-tier)", () => {
  it("returns contract shape: code, expiresAt, deepLink", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-issue", {
      method: "POST",
      headers: userHeaders(),
    });
    const res = await pairingIssue(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(typeof body.code).toBe("string");
    expect(typeof body.expiresAt).toBe("string");
    expect(typeof body.deepLink).toBe("string");
  });

  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-issue", {
      method: "POST",
    });
    const res = await pairingIssue(req);
    expect(res.status).toBe(401);
  });
});

describe("plan-state (user-tier)", () => {
  it("returns contract shape: plan, dailyMinutesRemaining, currentPeriodEnd", async () => {
    const req = new Request("http://localhost/functions/v1/plan-state", {
      method: "POST",
      headers: userHeaders(),
    });
    const res = await planState(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.plan === "free" || body.plan === "pro").toBe(true);
    expect(typeof body.dailyMinutesRemaining).toBe("number");
    expect("currentPeriodEnd" in body).toBe(true);
  });
});

describe("calendar-list (user-tier)", () => {
  it("returns contract shape: events array", async () => {
    const req = new Request("http://localhost/functions/v1/calendar-list", {
      method: "POST",
      headers: userHeaders(),
      body: JSON.stringify({ from: new Date().toISOString() }),
    });
    const res = await calendarList(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(Array.isArray(body.events)).toBe(true);
    const first = (body.events as Record<string, unknown>[])[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.summary).toBe("string");
    expect(typeof first.startsAt).toBe("string");
    expect(typeof first.endsAt).toBe("string");
  });
});

describe("memory-recall (user-tier)", () => {
  it("returns contract shape: results array with id, excerpt, score", async () => {
    const req = new Request("http://localhost/functions/v1/memory-recall", {
      method: "POST",
      headers: userHeaders(),
      body: JSON.stringify({ query: "test query" }),
    });
    const res = await memoryRecall(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(Array.isArray(body.results)).toBe(true);
    const first = (body.results as Record<string, unknown>[])[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.excerpt).toBe("string");
    expect(typeof first.score).toBe("number");
  });
});

// ---- HERMES-TIER stubs ----

describe("pairing-redeem (Hermes-tier)", () => {
  it("uses requireHermes: returns 403 with user JWT only", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: userHeaders(),
      body: JSON.stringify({ code: "A3K7MT2P", telegramUserId: 12345 }),
    });
    const res = await pairingRedeem(req);
    expect(res.status).toBe(403);
  });

  it("returns contract shape: ok, anchorUserId", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({ code: "A3K7MT2P", telegramUserId: 12345 }),
    });
    const res = await pairingRedeem(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(typeof body.ok).toBe("boolean");
  });

  it("returns 400 for invalid request body (missing telegramUserId)", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({ code: "A3K7MT2P" }), // telegramUserId missing
    });
    const res = await pairingRedeem(req);
    expect(res.status).toBe(400);
  });
});

describe("auth-resolve-telegram (Hermes-tier)", () => {
  it("returns contract shape: anchorUserId", async () => {
    const req = new Request("http://localhost/functions/v1/auth-resolve-telegram", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({ telegramUserId: 12345 }),
    });
    const res = await authResolveTelegram(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(typeof body.anchorUserId).toBe("string");
  });
});

describe("turn-start (Hermes-tier)", () => {
  it("returns contract shape: ok, plan, dailyMinutesRemaining", async () => {
    const req = new Request("http://localhost/functions/v1/turn-start", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        turnId: TURN_ID,
        channel: "telegram",
      }),
    });
    const res = await turnStart(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.plan === "free" || body.plan === "pro").toBe(true);
    expect(typeof body.dailyMinutesRemaining).toBe("number");
  });
});

describe("turn-deliver (Hermes-tier)", () => {
  it("returns contract shape: ok", async () => {
    const req = new Request("http://localhost/functions/v1/turn-deliver", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        turnId: TURN_ID,
        durationSeconds: 42,
      }),
    });
    const res = await turnDeliver(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
  });
});

describe("turn-fail (Hermes-tier)", () => {
  it("returns contract shape: ok", async () => {
    const req = new Request("http://localhost/functions/v1/turn-fail", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        turnId: TURN_ID,
        reason: "timeout",
      }),
    });
    const res = await turnFail(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
  });
});

describe("calendar-add (Hermes-tier)", () => {
  it("returns contract shape: ok, eventId", async () => {
    const req = new Request("http://localhost/functions/v1/calendar-add", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        summary: "Test event",
        startsAt: new Date(Date.now() + 86400_000).toISOString(),
        endsAt: new Date(Date.now() + 90000_000).toISOString(),
      }),
    });
    const res = await calendarAdd(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(typeof body.eventId).toBe("string");
  });
});

describe("memory-store (Hermes-tier)", () => {
  it("returns contract shape: ok, id", async () => {
    const req = new Request("http://localhost/functions/v1/memory-store", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        content: "Test memory fact",
        factType: "personal",
      }),
    });
    const res = await memoryStore(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe("string");
  });
});

describe("diary-append (Hermes-tier)", () => {
  it("returns contract shape: ok, id", async () => {
    const req = new Request("http://localhost/functions/v1/diary-append", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        body: "Today was a good day.",
      }),
    });
    const res = await diaryAppend(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe("string");
  });
});

describe("hermes-cache-invalidate (Hermes-tier)", () => {
  it("returns contract shape: ok", async () => {
    const req = new Request("http://localhost/functions/v1/hermes-cache-invalidate", {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify({
        anchorUserId: ANCHOR_USER_ID,
        reason: "plan_changed",
      }),
    });
    const res = await hermesCacheInvalidate(req);
    expect(res.status).toBe(200);
    const body = await parseJson(res) as Record<string, unknown>;
    expect(body.ok).toBe(true);
  });
});

// ---- CORS preflight (all stubs) ----

describe("CORS preflight", () => {
  it("pairing-redeem returns 204 on OPTIONS", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-redeem", {
      method: "OPTIONS",
    });
    const res = await pairingRedeem(req);
    expect(res.status).toBe(204);
  });

  it("pairing-issue returns 204 on OPTIONS", async () => {
    const req = new Request("http://localhost/functions/v1/pairing-issue", {
      method: "OPTIONS",
    });
    const res = await pairingIssue(req);
    expect(res.status).toBe(204);
  });
});

// ---- google-token module behaviors ----

describe("google-token: encryptRefreshToken / decryptRefreshToken round-trip", () => {
  it("round-trips a refresh token", async () => {
    const plaintext = "ya29.test-refresh-token-value-1234567890abcdef";
    const ciphertext = await encryptRefreshToken(plaintext);

    // Ciphertext must not be equal to plaintext (T-00-17)
    expect(ciphertext).not.toBe(plaintext);
    // Must contain the IV:ciphertext separator
    expect(ciphertext).toContain(":");

    // Decrypt must return the original
    const decrypted = await decryptRefreshToken(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const plaintext = "ya29.same-token";
    const cipher1 = await encryptRefreshToken(plaintext);
    const cipher2 = await encryptRefreshToken(plaintext);
    expect(cipher1).not.toBe(cipher2);
  });
});

describe("google-token: buildReConsentUrl", () => {
  it("includes access_type=offline", () => {
    const url = buildReConsentUrl("client-id-123", "https://anchor.app/oauth/callback");
    expect(url).toContain("access_type=offline");
  });

  it("includes prompt=consent", () => {
    const url = buildReConsentUrl("client-id-123", "https://anchor.app/oauth/callback");
    expect(url).toContain("prompt=consent");
  });

  it("includes calendar.events scope", () => {
    const url = buildReConsentUrl("client-id-123", "https://anchor.app/oauth/callback");
    // URL-encoded scope
    expect(url).toContain(encodeURIComponent(CALENDAR_SCOPE));
  });

  it("does NOT include access_type=online or other scope expansions", () => {
    const url = buildReConsentUrl("client-id-123", "https://anchor.app/oauth/callback");
    expect(url).not.toContain("access_type=online");
    expect(url).not.toContain("calendar%20");
    expect(url).not.toContain("calendar.readonly");
  });
});
