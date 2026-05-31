/**
 * i18n key-parity gate (DEC-0012).
 * Fails CI if DE and EN catalogs have mismatched flattened keys.
 * Usage: pnpm i18n:check
 */
import * as fs from 'fs';
import * as path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const LOCALES = ['de', 'en'] as const;
const NAMESPACE = 'common';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return flattenKeys(val as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

const keysByLocale: Record<string, string[]> = {};

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, locale, `${NAMESPACE}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing: ${filePath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
  keysByLocale[locale] = flattenKeys(data).sort();
}

const [primary, ...rest] = LOCALES;
let hasMismatch = false;

for (const locale of rest) {
  const missing = keysByLocale[primary].filter(k => !keysByLocale[locale].includes(k));
  const extra = keysByLocale[locale].filter(k => !keysByLocale[primary].includes(k));
  if (missing.length || extra.length) {
    hasMismatch = true;
    if (missing.length) console.error(`[${locale}] Missing keys: ${missing.join(', ')}`);
    if (extra.length) console.error(`[${locale}] Extra keys: ${extra.join(', ')}`);
  }
}

if (hasMismatch) {
  console.error('i18n key-parity check FAILED.');
  process.exit(1);
}

console.log('i18n key-parity check PASSED.');
