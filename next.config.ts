import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* Anchor webapp — Next 16 + next-intl v4 */
  turbopack: {
    // Fixes workspace-root detection warning when a parent directory has its own lockfile
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
