/**
 * i18n unused-key detector (warn-only, DEC-0012).
 * Lists keys present in DE/EN catalogs but not referenced in src/.
 * Non-blocking — always exits 0. Results are for PR-comment visibility only.
 * Usage: pnpm i18n:unused
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SRC_DIR = path.join(process.cwd(), 'src');
const PRIMARY_LOCALE = 'de';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return flattenKeys(val as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

function getAllCatalogKeys(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const dir = path.join(MESSAGES_DIR, PRIMARY_LOCALE);
  if (!fs.existsSync(dir)) return result;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const ns = file.replace(/\.json$/, '');
    const data = JSON.parse(
      fs.readFileSync(path.join(dir, file), 'utf-8'),
    ) as Record<string, unknown>;
    result.set(ns, flattenKeys(data));
  }
  return result;
}

function getSrcContent(): string {
  try {
    // Collect all TS/TSX file content from src/
    const output = execSync(
      `find "${SRC_DIR}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) -exec cat {} +`,
      { encoding: 'utf-8', timeout: 30_000 },
    );
    return output;
  } catch {
    // Fallback: read files manually
    const result: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          result.push(fs.readFileSync(full, 'utf-8'));
        }
      }
    }
    walk(SRC_DIR);
    return result.join('\n');
  }
}

const catalogKeys = getAllCatalogKeys();
const srcContent = getSrcContent();

let unusedCount = 0;

for (const [ns, keys] of catalogKeys) {
  const unused: string[] = [];
  for (const key of keys) {
    // Check for both 'namespace.key' and bare 'key' references in source
    const fullRef = `${ns}.${key}`;
    const bareRef = key.split('.').pop() ?? key;
    // Filter comment lines — look for actual string usage (inside quotes or t() calls)
    const referenced =
      srcContent.includes(`'${fullRef}'`) ||
      srcContent.includes(`"${fullRef}"`) ||
      srcContent.includes(`'${key}'`) ||
      srcContent.includes(`"${key}"`);
    if (!referenced) {
      unused.push(`${ns}.${key}`);
    }
  }
  if (unused.length) {
    unusedCount += unused.length;
    console.warn(`[${ns}] Potentially unused keys (${unused.length}):`);
    for (const k of unused) {
      console.warn(`  - ${k}`);
    }
  }
}

if (unusedCount > 0) {
  console.warn(`\ni18n unused-key scan: ${unusedCount} potentially unused key(s) found (non-blocking).`);
} else {
  console.log('i18n unused-key scan: no unused keys detected.');
}

// Always exit 0 — this is warn-only
process.exit(0);
