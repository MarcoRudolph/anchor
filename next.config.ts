import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* Anchor webapp — Next 16 + next-intl v4 */
};

export default withNextIntl(nextConfig);
