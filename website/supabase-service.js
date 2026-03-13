// Browser-side Supabase helper used by the `website/` pages.
// Requires the Supabase JS v2 UMD bundle to be loaded first (it exposes `window.supabase`).
//
// IMPORTANT:
// - Using the anon key in a frontend is OK.
// - NEVER use the Supabase service_role key in the browser.

// Supabase Configuration
// You can optionally set these before loading this script:
//   window.SUPABASE_URL = '...'
//   window.SUPABASE_ANON_KEY = '...'
const SUPABASE_URL =
  window.SUPABASE_URL || 'https://gdvitudsmqktiutyyndv.supabase.co';
const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkdml0dWRzbXFrdGl1dHl5bmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIxNjAsImV4cCI6MjA4ODkxODE2MH0.uxN2Obtx2EeErFK8sNMW15xpOMf8FSToiozX0vT_f1Q';

function createSupabaseClient() {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error(
      'Supabase JS SDK not loaded. Ensure the supabase-js CDN script loads before supabase-service.js'
    );
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function generateEntryId() {
  // 12-digit numeric entry ID used by the desktop app for login
  let result = '';
  for (let i = 0; i < 12; i++) result += Math.floor(Math.random() * 10);
  return result;
}

window.SupabaseService = class SupabaseService {
  constructor() {
    this.client = createSupabaseClient();
  }

  generateUserId() {
    return generateEntryId();
  }

  async signUpWithEmailPassword(email, password) {
    try {
      const { data, error } = await this.client.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  async loginWithEmailPassword(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Fetch profile from public.users by auth_id
      const { data: profile, error: profileError } = await this.client
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();
      if (profileError) throw profileError;

      return { success: true, user: profile, session: data.session };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  async getUserById(userId) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return { success: true, user: data };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  async createUser(userData) {
    try {
      const { data, error } = await this.client
        .from('users')
        .insert([
          {
            ...userData,
            tasks_completed: 0,
            hours_saved: 0,
            success_rate: 0,
            is_active: true,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return { success: true, user: data };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  async updateUser(userId, updateData) {
    try {
      const { error } = await this.client
        .from('users')
        .update(updateData)
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }
};

