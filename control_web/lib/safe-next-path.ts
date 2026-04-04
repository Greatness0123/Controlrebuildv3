/**
 * Returns a safe in-app path for post-login redirects (open redirect hardening).
 */
export function safeNextPath(next: string | null | undefined, fallback = '/workspace'): string {
  if (!next || typeof next !== 'string') return fallback;
  const t = next.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;
  return t;
}
