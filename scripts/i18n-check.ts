/**
 * i18n key-parity gate (DEC-0012).
 * Scans ALL messages/de/*.json and messages/en/*.json namespaces.
 * Fails CI (exit 1) if DE and EN catalogs have any missing or extra flattened keys.
 * Usage: pnpm i18n:check
 */
import * as fs from 'fs';
import * as path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const LOCALES = ['de', 'en'] as const;

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return flattenKeys(val as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

function getNamespaces(locale: string): string[] {
  const dir = path.join(MESSAGES_DIR, locale);
  if (!fs.existsSync(dir)) {
    console.error(`Missing locale directory: ${dir}`);
    process.exit(1);
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

// Collect namespaces from the primary locale (DE is authoritative — ADR-0012)
const primaryLocale = LOCALES[0]; // 'de'
const namespaces = getNamespaces(primaryLocale);

let hasMismatch = false;

for (const ns of namespaces) {
  const keysByLocale: Record<string, string[]> = {};

  for (const locale of LOCALES) {
    const filePath = path.join(MESSAGES_DIR, locale, `${ns}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`[${locale}] Missing namespace file: ${filePath}`);
      hasMismatch = true;
      keysByLocale[locale] = [];
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    keysByLocale[locale] = flattenKeys(data).sort();
  }

  const primaryKeys = keysByLocale[primaryLocale] ?? [];

  for (const locale of LOCALES.slice(1)) {
    const localeKeys = keysByLocale[locale] ?? [];
    const missing = primaryKeys.filter((k) => !localeKeys.includes(k));
    const extra = localeKeys.filter((k) => !primaryKeys.includes(k));

    if (missing.length || extra.length) {
      hasMismatch = true;
      if (missing.length)
        console.error(`[${ns}][${locale}] Missing keys: ${missing.join(', ')}`);
      if (extra.length)
        console.error(`[${ns}][${locale}] Extra keys: ${extra.join(', ')}`);
    }
  }
}

// Also check EN has no namespaces that DE is missing (extra EN namespaces = drift)
const enNamespaces = getNamespaces('en');
const extraEnNamespaces = enNamespaces.filter((ns) => !namespaces.includes(ns));
if (extraEnNamespaces.length) {
  hasMismatch = true;
  console.error(`[en] Extra namespace files not present in de: ${extraEnNamespaces.join(', ')}`);
}

if (hasMismatch) {
  console.error('i18n key-parity check FAILED.');
  process.exit(1);
}

console.log(`i18n key-parity check PASSED (${namespaces.length} namespace(s): ${namespaces.join(', ')}).`);
