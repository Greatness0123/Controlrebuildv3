import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: SupabaseClient | null = null;
let _cachedSession: any = null;
let _sessionFetched = false;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
  return _client;
}

export async function getSession(forceRefresh = false) {
  if (!forceRefresh && _cachedSession && _sessionFetched) {
    return _cachedSession;
  }
  
  const client = getSupabaseClient();
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.warn('Session error:', error.message);
      _cachedSession = null;
      _sessionFetched = true;
      return null;
    }
    _cachedSession = data.session;
    _sessionFetched = true;
    return data.session;
  } catch (e) {
    console.warn('Session fetch failed:', e);
    _cachedSession = null;
    _sessionFetched = true;
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.access_token ?? null;
  } catch (e) {
    console.warn('getAccessToken failed:', e);
    return null;
  }
}

export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, firstName: string, lastName: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { 
      data: { 
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim(),
        plan: 'free',
        onboarding_completed: false,
      } 
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  _cachedSession = null;
  _sessionFetched = false;
  const client = getSupabaseClient();
  await client.auth.signOut();
}
