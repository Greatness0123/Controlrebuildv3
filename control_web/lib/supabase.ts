import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getEnv(name: string): string | undefined {
  const val = process.env[name];
  return val && val.length > 0 ? val : undefined;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    // Don't throw during build; allow pages to render with degraded functionality.
    // UI components should show a "not configured" state when null is returned.
    return null;
  }

  _client = createClient(url, anonKey);
  return _client;
}
