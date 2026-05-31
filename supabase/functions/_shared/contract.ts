/**
 * Anchor↔Hermes Edge Function contract types.
 *
 * This file is the executable TypeScript mirror of docs/api/openapi.yaml.
 * It defines the request and response shapes for all 13 endpoints.
 *
 * FREEZE ARTIFACT — do not edit without a contract-change review.
 * Wave owners replace stub internals behind these unchanged shapes.
 */

// ---------------------------------------------------------------------------
// pairing-issue  (user-tier)
// ---------------------------------------------------------------------------

/** No request body; user identity comes from the session JWT. */
export type PairingIssueRequest = Record<string, never>;

export interface PairingIssueResponse {
  /** 8-char Crockford Base32 pairing code (0-9A-HJKMNP-TV-Z) */
  code: string;
  /** UTC expiry (15 minutes from issuance) */
  expiresAt: string;
  /** t.me/<bot>?start=<code> */
  deepLink: string;
}

// ---------------------------------------------------------------------------
// pairing-redeem  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface PairingRedeemRequest {
  /** 8-char Crockford Base32 code */
  code: string;
  /** Telegram user_id from the /start update */
  telegramUserId: number;
  /** Telegram @username (optional, for display) */
  telegramUsername?: string;
}

export interface PairingRedeemResponse {
  ok: boolean;
  /** Populated when ok=true */
  anchorUserId?: string;
  /** "already_consumed" | "expired" | "not_found" — when ok=false */
  error?: string;
}

// ---------------------------------------------------------------------------
// auth-resolve-telegram  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface AuthResolveTelegramRequest {
  telegramUserId: number;
}

export interface AuthResolveTelegramResponse {
  anchorUserId: string;
}

// ---------------------------------------------------------------------------
// turn-start  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface TurnStartRequest {
  anchorUserId: string;
  /** Idempotency key for this turn */
  turnId: string;
  channel: "telegram" | "voice";
}

export interface TurnStartResponse {
  ok: boolean;
  plan: "free" | "pro";
  dailyMinutesRemaining: number;
}

// ---------------------------------------------------------------------------
// turn-deliver  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface TurnDeliverRequest {
  anchorUserId: string;
  turnId: string;
  durationSeconds: number;
}

export interface TurnDeliverResponse {
  ok: boolean;
}

// ---------------------------------------------------------------------------
// turn-fail  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface TurnFailRequest {
  anchorUserId: string;
  turnId: string;
  reason: string;
}

export interface TurnFailResponse {
  ok: boolean;
}

// ---------------------------------------------------------------------------
// plan-state  (user-tier)
// ---------------------------------------------------------------------------

/** No request body; user identity from JWT. */
export type PlanStateRequest = Record<string, never>;

export interface PlanStateResponse {
  plan: "free" | "pro";
  dailyMinutesRemaining: number;
  currentPeriodEnd: string | null;
}

// ---------------------------------------------------------------------------
// calendar-list  (user-tier)
// ---------------------------------------------------------------------------

export interface CalendarListRequest {
  from?: string;
  to?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
}

export interface CalendarListResponse {
  events: CalendarEvent[];
}

// ---------------------------------------------------------------------------
// calendar-add  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface CalendarAddRequest {
  anchorUserId: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  description?: string;
}

export interface CalendarAddResponse {
  ok: boolean;
  eventId: string;
}

// ---------------------------------------------------------------------------
// memory-recall  (user-tier)
// ---------------------------------------------------------------------------

export interface MemoryRecallRequest {
  query: string;
  limit?: number;
}

export interface MemoryRecallResult {
  id: string;
  excerpt: string;
  score: number;
  occurredAt?: string;
}

export interface MemoryRecallResponse {
  results: MemoryRecallResult[];
}

// ---------------------------------------------------------------------------
// memory-store  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface MemoryStoreRequest {
  anchorUserId: string;
  content: string;
  factType: string;
  sourceEvidenceId?: string | null;
}

export interface MemoryStoreResponse {
  ok: boolean;
  id: string;
}

// ---------------------------------------------------------------------------
// diary-append  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface DiaryAppendRequest {
  anchorUserId: string;
  body: string;
  title?: string | null;
  entryDate?: string;
}

export interface DiaryAppendResponse {
  ok: boolean;
  id: string;
}

// ---------------------------------------------------------------------------
// hermes-cache-invalidate  (Hermes-tier)
// ---------------------------------------------------------------------------

export interface HermesCacheInvalidateRequest {
  anchorUserId: string;
  reason: "plan_changed" | "subscription_deleted";
}

export interface HermesCacheInvalidateResponse {
  ok: boolean;
}

// ---------------------------------------------------------------------------
// Tier map (mirrors openapi.yaml security tags — authoritative ref)
// ---------------------------------------------------------------------------

export type HermesEndpoint =
  | "pairing-redeem"
  | "auth-resolve-telegram"
  | "turn-start"
  | "turn-deliver"
  | "turn-fail"
  | "calendar-add"
  | "memory-store"
  | "diary-append"
  | "hermes-cache-invalidate";

export type UserEndpoint =
  | "pairing-issue"
  | "plan-state"
  | "calendar-list"
  | "memory-recall";

export type AllEndpoints = HermesEndpoint | UserEndpoint;
