/**
 * Cross-runtime env helper.
 *
 * Deno (prod): reads from Deno.env.get()
 * Node (Vitest tests): reads from process.env
 *
 * This abstraction ensures _shared modules are import-safe in both runtimes
 * without top-level `Deno.env.get()` calls that would crash in Node.
 */
export function env(key: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deno = (globalThis as any).Deno;
  if (deno?.env?.get) {
    return deno.env.get(key);
  }
  return process.env[key];
}
