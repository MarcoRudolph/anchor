/**
 * useConnectionStatus — Realtime-bound Telegram pairing status hook.
 *
 * Subscribes to the anchor_user row for the authenticated user via Supabase
 * Realtime postgres_changes. Derives `connected = telegram_user_id !== null`
 * STRICTLY from the DB row — the badge is driven by the confirmed server write
 * only, never by client-side prediction (DEC-0015 / Pattern 4 / T-00-25).
 *
 * Fallbacks:
 *  - 30-second polling: runs the same anchor_user SELECT if Realtime is slow
 *    or unavailable. Keeps parity — same state source, same derivation.
 *  - visibilitychange / focus: re-subscribes + catch-up fetch for mobile Safari
 *    which closes WebSocket connections on page hide (DEC-0015).
 *
 * Teardown: all listeners / channels / timers cleaned up in useEffect cleanup
 * (called on route change or unmount).
 *
 * RLS security (T-00-23): subscription filtered to `anchor_user WHERE id = auth.uid()`.
 * No cross-user data is ever delivered.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// ---- Connection status type ----

export type ConnectionStatus = 'loading' | 'unpaired' | 'connected';

// ---- Supabase client (browser-safe, anon key) ----
// We create a single client per hook instance — the component is responsible
// for mounting it only when a session is present.

function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('[useConnectionStatus] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY not set');
  }

  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

// ---- Polling interval ----
const POLL_INTERVAL_MS = 30_000; // 30 s

// ---- Hook ----

/**
 * Returns the current Telegram pairing status for the authenticated user.
 *
 * Must be used inside an authenticated route (session must exist before mount).
 *
 * @param userId - The authenticated user's UUID (from the session).
 *                 If undefined, returns 'loading' until it is set.
 */
export function useConnectionStatus(userId: string | undefined): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('loading');

  // Stable refs to avoid stale closures in event listeners
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  // Keep userIdRef in sync
  userIdRef.current = userId;

  /** Fetches the anchor_user row and derives the status. */
  const fetchStatus = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId || !supabaseRef.current) return;

    const { data, error } = await supabaseRef.current
      .from('anchor_user')
      .select('telegram_user_id')
      .eq('id', currentUserId)
      .single();

    if (error) {
      console.warn('[useConnectionStatus] Poll error:', error.message);
      return;
    }

    // Status derived ONLY from the confirmed DB row — no client-side prediction
    const connected = data?.telegram_user_id != null;
    setStatus(connected ? 'connected' : 'unpaired');
  }, []);

  /** Tears down the existing Realtime subscription and poll timer. */
  const teardown = useCallback(() => {
    if (channelRef.current) {
      supabaseRef.current?.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** Sets up the Realtime channel + polling for the given userId. */
  const setup = useCallback(
    (currentUserId: string) => {
      if (!supabaseRef.current) return;

      teardown();

      // Realtime subscription: anchor_user row changes for this user (T-00-23 RLS-scoped)
      const channel = supabaseRef.current
        .channel(`anchor_user:${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'anchor_user',
            filter: `id=eq.${currentUserId}`,
          },
          (payload) => {
            // Derive status from the new confirmed row value (T-00-25: DB is the source of truth)
            const newRecord = payload.new as { telegram_user_id?: number | null } | null;
            if (newRecord !== null && typeof newRecord === 'object') {
              const connected = newRecord.telegram_user_id != null;
              setStatus(connected ? 'connected' : 'unpaired');
            }
          },
        )
        .subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            // Catch-up fetch immediately on subscribe (avoids missing an update
            // that occurred between page load and subscription being established)
            void fetchStatus();
          }
        });

      channelRef.current = channel;

      // 30-second polling fallback (same derivation as Realtime)
      pollTimerRef.current = setInterval(() => {
        void fetchStatus();
      }, POLL_INTERVAL_MS);

      // Initial fetch (before the subscription is confirmed)
      void fetchStatus();
    },
    [fetchStatus, teardown],
  );

  useEffect(() => {
    if (!userId) {
      setStatus('loading');
      return;
    }

    // Lazy-create the Supabase client
    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createBrowserClient();
      } catch (err) {
        console.error('[useConnectionStatus] Failed to create Supabase client:', err);
        return;
      }
    }

    setup(userId);

    // Mobile Safari visibility re-subscribe (DEC-0015)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userIdRef.current) {
        // Re-subscribe and catch-up on return from background
        setup(userIdRef.current);
      }
    };

    const handleFocus = () => {
      if (userIdRef.current) {
        // Catch-up fetch on window focus
        void fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup on route change / unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      teardown();
    };
  }, [userId, setup, fetchStatus, teardown]);

  return status;
}
