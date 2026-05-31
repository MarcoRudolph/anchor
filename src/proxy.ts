// Next 16: locale middleware lives in proxy.ts (was middleware.ts pre-Next-16).
// A middleware.ts file is silently IGNORED on Next 16.
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, static files, and Next internals
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
