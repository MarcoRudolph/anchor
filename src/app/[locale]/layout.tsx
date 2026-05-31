import type { Metadata } from 'next';
import { Unbounded } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { Wordmark } from '@/components/brand/Wordmark';
import '../globals.css';

/**
 * Unbounded weight 900 — display font for brand wordmark.
 * Loaded with display:swap + preload for Lighthouse performance budget.
 * Sets --font-unbounded CSS variable consumed by --font-display in globals.css.
 */
const unbounded = Unbounded({
  weight: '900',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-unbounded',
});

export const metadata: Metadata = {
  title: 'Anchor',
  description: 'Dein persönlicher Gedächtnisassistent / Your personal memory companion',
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // T-00-04 mitigation: validate locale segment; unknown locales → 404
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={unbounded.variable}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <NextIntlClientProvider>
          {/* Minimal app shell header — branding only; feature nav comes in later waves */}
          <header className="border-b border-neutral-100 px-6 py-4">
            <Wordmark />
          </header>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
