import { useTranslations } from 'next-intl';

/**
 * Phase-0 home/onboarding entry point (RSC).
 * Minimal: renders catalog-driven tagline, no feature logic.
 * This is the page Lighthouse budgets run against (<90KB first-load JS landing).
 */
export default function HomePage() {
  const t = useTranslations('appShell');

  return (
    <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mt-4 text-lg text-neutral-600">{t('tagline')}</p>
    </section>
  );
}
