/**
 * PairingPanel — Telegram pairing code UI component (ADR-0007 / DEC-0007).
 *
 * On mount:
 *   1. Calls pairing-issue (user JWT) to obtain an 8-char Crockford code + deep link.
 *   2. Renders the code, the t.me/<bot>?start=<code> deep link, and a copy fallback.
 *   3. Binds a "connected"/"verbunden" badge to useConnectionStatus (non-optimistic).
 *
 * Bot handle: from NEXT_PUBLIC_TELEGRAM_BOT_USERNAME env var, NOT a locale file.
 * Display text: from next-intl catalogs (DE authoritative).
 *
 * Security (T-00-22): code issuance rate-limited 5/hr in the edge fn.
 * Security (T-00-25): badge NEVER flips to connected before the DB row reflects it.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useConnectionStatus } from '@/lib/realtime/useConnectionStatus';

interface PairingIssueResponse {
  code: string;
  expiresAt: string;
  deepLink: string;
}

interface PairingPanelProps {
  /** The authenticated user's UUID — used to scope the Realtime subscription */
  userId: string;
  /** The user's session JWT — passed as Authorization bearer to pairing-issue */
  accessToken: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export function PairingPanel({ userId, accessToken }: PairingPanelProps) {
  const t = useTranslations('pairing');

  const [pairingData, setPairingData] = useState<PairingIssueResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const connectionStatus = useConnectionStatus(userId);

  /** Calls pairing-issue with the user's session JWT. */
  const loadPairingCode = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pairing-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.error('[PairingPanel] pairing-issue returned', response.status);
        setLoadError(true);
        return;
      }

      const data = (await response.json()) as PairingIssueResponse;
      setPairingData(data);
    } catch (err) {
      console.error('[PairingPanel] Failed to load pairing code:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadPairingCode();
  }, [loadPairingCode]);

  /** Copy-to-clipboard fallback (T-00-22 UX requirement) */
  const handleCopy = useCallback(async () => {
    if (!pairingData?.code) return;
    try {
      await navigator.clipboard.writeText(pairingData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore (fallback: user sees the code)
    }
  }, [pairingData?.code]);

  const isConnected = connectionStatus === 'connected';

  return (
    <section
      className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
      aria-label={t('headline')}
    >
      {/* Heading */}
      <h2 className="mb-2 font-display text-2xl font-black tracking-tight text-neutral-900">
        {t('headline')}
      </h2>
      <p className="mb-6 text-sm text-neutral-500">{t('subline')}</p>

      {/* Connection status badge */}
      <div className="mb-6 flex items-center gap-2">
        <span
          data-testid={isConnected ? 'telegram-status-connected' : 'telegram-status-unpaired'}
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            isConnected
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-neutral-100 text-neutral-500',
          ].join(' ')}
        >
          <span
            className={[
              'size-1.5 rounded-full',
              isConnected ? 'bg-emerald-500' : 'bg-neutral-400',
            ].join(' ')}
          />
          {isConnected ? t('statusConnected') : t('statusUnpaired')}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-neutral-400">{t('loadingCode')}</p>
      )}

      {/* Error state */}
      {!isLoading && loadError && (
        <div className="space-y-3">
          <p className="text-sm text-red-500">{t('errorLoadingCode')}</p>
          <button
            type="button"
            onClick={() => void loadPairingCode()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {t('retryButton')}
          </button>
        </div>
      )}

      {/* Pairing code + deep link */}
      {!isLoading && !loadError && pairingData && !isConnected && (
        <div className="space-y-4">
          {/* Code display */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('codeLabel')}
            </p>
            <div className="flex items-center gap-3">
              <code
                data-testid="pairing-code"
                className="flex-1 rounded-lg bg-neutral-50 px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-neutral-900"
              >
                {pairingData.code}
              </code>
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-label={copied ? t('copiedButton') : t('copyButton')}
                className="rounded-lg border border-neutral-200 px-3 py-3 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                {copied ? t('copiedButton') : t('copyButton')}
              </button>
            </div>
          </div>

          {/* Deep link */}
          <a
            data-testid="pairing-deep-link"
            href={pairingData.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1a8fc4]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.13 13.545 4.17 12.629c-.657-.204-.67-.657.136-.975l11.57-4.461c.545-.196 1.022.133.845.973-.001 0-.001.001 0 0l-.827-.945z" />
            </svg>
            {t('deepLinkLabel')}
          </a>

          {/* Expiry + security hint */}
          <p className="text-xs text-neutral-400">
            {t('expiresLabel')}:{' '}
            {new Date(pairingData.expiresAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            {t('securityHint')}
          </p>
        </div>
      )}

      {/* Connected state — summary */}
      {isConnected && (
        <div
          data-testid="pairing-section"
          className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
        >
          {t('statusConnected')} — {t('statusVerbunden')}
        </div>
      )}
    </section>
  );
}
