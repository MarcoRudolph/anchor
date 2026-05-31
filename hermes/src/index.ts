/**
 * Hermes HTTP server entry point (ADR-0002 / ADR-0003).
 *
 * Boots a minimal Node.js HTTP server and registers:
 *   POST /webhook  — Telegram webhook receiver
 *   GET  /health   — container health probe
 *
 * Environment variables:
 *   PORT                  — listen port (default 8080)
 *   TELEGRAM_BOT_TOKEN    — Telegram bot token
 *   TELEGRAM_WEBHOOK_SECRET — optional webhook secret-token (T-00-24)
 *   EDGE_BASE             — loopback Supabase URL (e.g. http://localhost:54321)
 *   SUPABASE_SERVICE_ROLE_KEY — service-role JWT for edge fn calls
 *   HERMES_SHARED_SECRET  — shared secret for two-tier auth
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { handleTelegramWebhook } from './webhook.js';

const PORT = parseInt(process.env.PORT ?? '8080', 10);

/** Reads the full request body as a UTF-8 string. */
async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/** Sends a JSON response. */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const method = req.method?.toUpperCase() ?? 'GET';
  const url = req.url ?? '/';

  // Health probe
  if (method === 'GET' && url === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  // Telegram webhook
  if (method === 'POST' && url === '/webhook') {
    let rawBody: string;
    try {
      rawBody = await readBody(req);
    } catch {
      sendJson(res, 400, { error: 'unreadable_body' });
      return;
    }

    let update: unknown;
    try {
      update = JSON.parse(rawBody);
    } catch {
      sendJson(res, 400, { error: 'invalid_json' });
      return;
    }

    // Extract secret-token header for T-00-24 validation
    const secretTokenHeader = (req.headers['x-telegram-bot-api-secret-token'] as string) ?? '';

    // Process async but respond 200 immediately (Telegram expects fast ack)
    sendJson(res, 200, { ok: true });

    // Process webhook after responding (fire-and-forget, errors logged internally)
    handleTelegramWebhook(update as Parameters<typeof handleTelegramWebhook>[0], secretTokenHeader).catch(
      (err) => console.error('[hermes/index] Unhandled webhook error:', err),
    );
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`[hermes] Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[hermes] SIGTERM received — shutting down');
  server.close(() => process.exit(0));
});
