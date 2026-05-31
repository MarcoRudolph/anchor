/**
 * Routing configuration tests (ADR-0012).
 * Asserts:
 * - defaultLocale === 'de' (DE is authoritative)
 * - locales === ['de', 'en']
 * - localePrefix === 'always'
 * - no catalog value equals the bare wordmark literal 'anchor' (the Wordmark
 *   component renders it hardcoded — no dedicated translation key should exist
 *   for the wordmark itself; brand name appearing in copy sentences is fine)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { routing } from '@/i18n/routing';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');
const LOCALES = ['de', 'en'] as const;

function flattenValues(obj: Record<string, unknown>, result: string[] = []): string[] {
  for (const val of Object.values(obj)) {
    if (typeof val === 'string') {
      result.push(val);
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenValues(val as Record<string, unknown>, result);
    }
  }
  return result;
}

describe('i18n routing config (ADR-0012)', () => {
  it('defaultLocale is "de"', () => {
    expect(routing.defaultLocale).toBe('de');
  });

  it('locales are ["de", "en"]', () => {
    expect(routing.locales).toEqual(['de', 'en']);
  });

  it('localePrefix is "always"', () => {
    expect(routing.localePrefix).toBe('always');
  });
});

describe('i18n catalog wordmark guard (ADR-0012)', () => {
  for (const locale of LOCALES) {
    const localeDir = path.join(MESSAGES_DIR, locale);
    if (!fs.existsSync(localeDir)) continue;

    const namespaceFiles = fs
      .readdirSync(localeDir)
      .filter((f) => f.endsWith('.json'));

    for (const file of namespaceFiles) {
      const ns = file.replace(/\.json$/, '');
      it(`[${locale}/${ns}] has no catalog value that IS exactly the bare wordmark "anchor"`, () => {
        // The Wordmark component renders 'anchor' hardcoded (not via a t() call).
        // No translation key should have a value equal to the bare wordmark.
        // Brand name appearing in copy sentences (e.g. "Welcome to Anchor") is fine.
        const filePath = path.join(localeDir, file);
        const data = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as Record<string, unknown>;
        const values = flattenValues(data);
        const bareWordmarkValues = values.filter(
          (v) => v.trim().toLowerCase() === 'anchor',
        );
        expect(bareWordmarkValues).toHaveLength(0);
      });
    }
  }
});
