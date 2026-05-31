---
description: "Deployment handoff for the VPS server-agent: deploy the 13 Anchor edge functions + the Anchor Hermes container to the self-hosted Supabase stack, wire the Telegram webhook, and complete the UJ-002 real-device pairing exit gate (plan 00-06 Task 4)."
paths:
  - "../../supabase/functions"
  - "../../hermes"
  - "../handoff.md"
  - "../../.planning/phases/00-spine-interface-freeze/00-06-PLAN.md"
---

# Phase-0 Exit-Gate Deployment Handoff (for the VPS server-agent)

**You** are the agent with shell access to the Hostinger VPS `srv1677122` (76.13.157.62) and its Docker stack. **Goal:** deploy the Anchor edge functions + the Anchor Hermes orchestrator, then prove **UJ-002** end-to-end on a real phone. This is the Phase-0 exit gate (plan `00-06` Task 4, a `checkpoint:human-verify`).

> ⚠️ **Name collision:** the running container `hermes-agent-bs3u-hermes-agent-1` (`ghcr.io/hostinger/hvps-hermes-agent`) is the *Hostinger HVPS agent* (probably you). The **Anchor "Hermes"** in this handoff is a DIFFERENT, NEW service built from `hermes/` in this repo. It does not exist on the VPS yet — you build and run it.

---

## 0. Prerequisites

1. **Get the repo at the right branch.** The Anchor repo is NOT on the VPS yet. Clone it (or have it pushed to you) and check out branch **`plan/phase-00-spine-interface-freeze`**. You need `supabase/functions/`, `hermes/`, and `docs/`.
2. **Secrets/env.** All Anchor keys live in the repo-root `.env` on Marco's machine under `ANCHOR_*` (also present: `TELEGRAM_BOT_TOKEN`). For the VPS deploy you map them as below. Two secrets must be **generated once and shared between Hermes and the edge functions**:
   - `HERMES_SHARED_SECRET` — generate: `openssl rand -hex 32`. MUST be identical in the Hermes env and the edge-functions env.
   - `GOOGLE_TOKEN_MASTER_KEY` — generate: `openssl rand -base64 32` (AES-256 key for the Google-token module; not exercised by UJ-002 but required for the edge-fn env to boot cleanly).
3. **The schema is already applied** to `supabase-anchor-db` (18 tables, RLS, realtime publication — see `docs/handoff.md`). Do NOT re-apply migrations.

### VPS facts (verified 2026-05-31)

| Thing | Value |
|-------|-------|
| Edge-runtime container | `supabase-anchor-edge-functions` (`supabase/edge-runtime`), CMD `start --main-service /home/deno/functions/main` |
| Edge functions volume | host `/opt/supabase-anchor/volumes/functions` → container `/home/deno/functions` |
| Docker network | `supabase-anchor_default` |
| Kong (internal) | `http://supabase-anchor-kong:8000` (routes `/functions/v1/<name>`) |
| DB container | `supabase-anchor-db` (Postgres 15.8.1) |
| Public gateway | `https://supabase-anchor.rudolpho-ai.de` (port 443) |
| Compose dir (typical) | `/opt/supabase-anchor/` (docker-compose + `.env`) |

---

## Part A — Deploy the 13 edge functions to self-hosted Supabase

The 13 functions + `_shared/` are in `supabase/functions/`. Self-hosted Supabase serves whatever is in the mounted volume.

1. **Copy the function source into the volume:**
   ```bash
   # from the repo root on the VPS (or rsync from wherever you checked it out)
   sudo rsync -a --delete supabase/functions/ /opt/supabase-anchor/volumes/functions/
   # result: /opt/supabase-anchor/volumes/functions/{_shared,pairing-issue,pairing-redeem,...}/
   ```
   - The 13 dirs: `pairing-issue, pairing-redeem, auth-resolve-telegram, turn-start, turn-deliver, turn-fail, plan-state, calendar-list, calendar-add, memory-recall, memory-store, diary-append, hermes-cache-invalidate`.
   - Keep the existing `main/` router dir that's already in the volume (the edge-runtime `--main-service`). Do NOT delete `main`. If `--delete` would remove it, drop `--delete` and copy additively.
   - `_shared/` must be present (the stubs import `../_shared/auth.ts` etc.).

2. **Set the edge-functions env.** Add these to the edge-runtime container's environment (the self-hosted way: append to `/opt/supabase-anchor/.env` and/or the `functions` service `environment:` in the compose, then recreate). `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are usually already injected by the compose — verify they are, then ADD:
   ```
   HERMES_SHARED_SECRET=<the openssl rand -hex 32 value>
   GOOGLE_TOKEN_MASTER_KEY=<the openssl rand -base64 32 value>
   ANCHOR_WEBAPP_URL=<the webapp origin, e.g. https://anchor.rudolpho-ai.de or the Vercel URL>
   ```
   (Required env var names, confirmed from code: `_shared` uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HERMES_SHARED_SECRET`, `GOOGLE_TOKEN_MASTER_KEY`, `ANCHOR_WEBAPP_URL`.)

3. **JWT-verification gotcha.** Our handlers do their own auth (`requireUser` calls `/auth/v1/user`; `requireHermes` checks the service-role bearer + `x-hermes-secret`). If the edge-runtime / Kong is configured to hard-verify JWTs *before* the handler, a Hermes call (service-role JWT) still passes, but make sure platform-level verification is not stripping the `x-hermes-secret` header and not rejecting the service-role token. If functions 401 unexpectedly, check the edge-runtime `--no-verify-jwt` / per-function `verify_jwt` config and Kong's `/functions/v1` route.

4. **Restart + smoke:**
   ```bash
   docker restart supabase-anchor-edge-functions
   docker logs --tail=50 supabase-anchor-edge-functions   # expect clean boot, functions registered
   # internal smoke (run from a container on supabase-anchor_default, or via the host Kong port):
   # a Hermes-tier call WITHOUT the secret must be 403:
   curl -s -o /dev/null -w '%{http_code}\n' -X POST \
     http://localhost:8004/functions/v1/pairing-redeem \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H 'content-type: application/json' -d '{}'        # expect 403 (missing x-hermes-secret)
   ```
   `127.0.0.1:8004` is Kong's host-published port (→ kong:8000). Adjust if your compose differs.

**Done when:** all 13 functions boot, a Hermes-only verb 403s without `x-hermes-secret`, and a malformed body is rejected by zod.

---

## Part B — Build & run the Anchor Hermes orchestrator

Source: `hermes/` (own `Dockerfile`, `package.json`, `tsconfig.json`; thin Node/TS — webhook receive → `/start CODE` parse → `pairing-redeem` call → echo turn). Required env (confirmed from `hermes/src/`):

| Var | Value |
|-----|-------|
| `EDGE_BASE` | `http://supabase-anchor-kong:8000` (internal, since Hermes joins `supabase-anchor_default`) |
| `SUPABASE_SERVICE_ROLE_KEY` | = `ANCHOR_SERVICE_ROLE_KEY` from `.env` |
| `HERMES_SHARED_SECRET` | the SAME value set in Part A step 2 |
| `TELEGRAM_BOT_TOKEN` | = `TELEGRAM_BOT_TOKEN` from `.env` |
| `TELEGRAM_WEBHOOK_SECRET` | generate `openssl rand -hex 16` (Telegram `secret_token`; validated in `webhook.ts`) |
| `PORT` | `8080` (Dockerfile EXPOSEs 8080) |

1. **Build & run on the Supabase network:**
   ```bash
   cd hermes
   docker build -t anchor-hermes:phase0 .
   docker run -d --name anchor-hermes --restart unless-stopped \
     --network supabase-anchor_default \
     -e EDGE_BASE=http://supabase-anchor-kong:8000 \
     -e SUPABASE_SERVICE_ROLE_KEY=... \
     -e HERMES_SHARED_SECRET=... \
     -e TELEGRAM_BOT_TOKEN=... \
     -e TELEGRAM_WEBHOOK_SECRET=... \
     -e PORT=8080 \
     anchor-hermes:phase0
   docker logs --tail=30 anchor-hermes      # expect "listening on :8080" + GET /health ok
   ```

2. **Expose Hermes publicly over HTTPS** (Telegram requires an HTTPS webhook). Add a reverse-proxy vhost (the same proxy that fronts the Supabase gateway) for a subdomain, e.g. `hermes-anchor.rudolpho-ai.de` → `anchor-hermes:8080` (or the host-published port), with a Let's Encrypt cert. Create the DNS A record → 76.13.157.62 first. Proxy must forward `POST /webhook` and pass the body + Telegram's `X-Telegram-Bot-Api-Secret-Token` header unmodified.

3. **Register the Telegram webhook:**
   ```bash
   curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -d "url=https://hermes-anchor.rudolpho-ai.de/webhook" \
     -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
   curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"   # confirm url + pending_update_count=0
   ```

4. **Get the bot username** (for the webapp deep link): `curl -s https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe` → `result.username`. The webapp needs `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<that username>` at build/runtime.

**Done when:** `anchor-hermes` is healthy, reachable at the public HTTPS webhook URL, and `getWebhookInfo` shows it bound with no errors.

---

## Part C — Webapp (so a human can log in and see the pairing page)

The webapp (Next.js) must be running and pointed at the VPS Supabase, with these env vars:
```
NEXT_PUBLIC_SUPABASE_URL=https://supabase-anchor.rudolpho-ai.de
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANCHOR_ANON_KEY>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<from getMe>
SUPABASE_SERVICE_ROLE_KEY=<ANCHOR_SERVICE_ROLE_KEY>   # server-only (magic-link callback)
STRIPE_SECRET_KEY=<stripe test/live secret>           # server-only (customer-at-signup)
```
- Supabase Auth `SITE_URL` + redirect allow-list must include the webapp origin so the magic link opens there (set in the GoTrue/`supabase-anchor-auth` env).
- The webapp can run on Vercel (uses the HTTPS API URL, cannot SSH-tunnel) or anywhere reachable. The pairing page is `/<locale>/pair`.

---

## Part D — UJ-002 real-device verification (the exit gate)

On a **real phone** with the webapp open:

1. Log into the webapp via magic link; go to `/<locale>/pair`. Confirm an **8-char Crockford code** + a `https://t.me/<bot>?start=<code>` deep link render.
2. Tap the deep link (or send `/start <code>` to the bot in Telegram).
3. Confirm: Telegram receives the **echo turn**, and the webapp flips to **"connected"/"verbunden"** within a few seconds **via Realtime, with NO page reload**.
4. Confirm **single-use**: a second `/start <same code>` does NOT re-pair. Confirm **15-min TTL**: an unused code expires.
5. Confirm the binding landed on the correct `anchor_user` (no cross-account binding).

### Report back to the orchestrator
- ✅ Success → reply **"seam proven"** with: the bot username used, that the webapp flipped to connected via Realtime without reload, and that single-use + TTL held.
- ❌ Failure → say exactly where it broke: **webhook** (Telegram → Hermes), **redeem** (Hermes → `pairing-redeem` edge fn — check `x-hermes-secret`/service-role 403s), or **realtime** (DB row updated but UI didn't flip — check the `supabase_realtime` publication + the browser channel). Include the relevant `docker logs anchor-hermes` / edge-fn log lines.

---

## Quick reference — what proves vs. what's already done
- **Already done (committed):** schema applied to VPS, 13 edge-fn stubs authored, two-tier auth, Google-token module, magic-link wiring, Hermes skeleton code, pairing UI + Realtime hook, UJ-002 Playwright spec (passes against a local stub-bot stack in CI).
- **This handoff proves:** the live seam — Telegram → Hermes → edge fn → DB → Realtime → webapp — on a real device. That closes Phase 0 and unblocks the parallel Phase-1 waves.
