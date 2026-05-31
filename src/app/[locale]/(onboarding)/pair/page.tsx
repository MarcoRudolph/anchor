/**
 * Pairing page — /[locale]/(onboarding)/pair
 *
 * Server Component. Requires an authenticated session; redirects to magic-link
 * login if none is present (DEC-0006 / ADR-0006).
 *
 * Renders PairingPanel in the app shell.
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PairingPanel } from '@/components/pairing/PairingPanel';

/**
 * Creates a read-only Supabase server client for session inspection.
 * Uses the anon key — only reads the session cookie, no writes.
 */
async function createReadonlyServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server Component — no cookie writes
        },
      },
    },
  );
}

interface PairPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PairPage({ params }: PairPageProps) {
  const { locale } = await params;

  const supabase = await createReadonlyServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session — redirect to magic-link login
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-16">
      <PairingPanel
        userId={session.user.id}
        accessToken={session.access_token}
      />
    </div>
  );
}
