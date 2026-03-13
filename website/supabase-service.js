<<<<<<< HEAD
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

=======
class SupabaseService {
    constructor() {
        // These will be replaced by the user during setup or injected
        this.supabaseUrl = window.SUPABASE_URL || '';
        this.supabaseKey = window.SUPABASE_ANON_KEY || '';

        if (typeof supabase !== 'undefined') {
            this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        } else {
            console.error('Supabase SDK not loaded');
        }
    }

    async signIn(email, password) {
        if (!this.client) return { success: false, message: 'Supabase not initialized' };

        const { data, error } = await this.client.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) return { success: false, message: error.message };

        // Fetch additional user profile data from public.users table
        const { data: profile } = await this.client
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return { success: true, user: { ...data.user, ...profile } };
    }

    async signUp(email, password, name) {
        if (!this.client) return { success: false, message: 'Supabase not initialized' };

        const { data, error } = await this.client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: name }
            }
        });

        if (error) return { success: false, message: error.message };

        // Generate a 12-digit App ID for desktop linking
        const appId = await this.generateAppId();

        // Create profile in public.users table
        const { error: profileError } = await this.client
            .from('users')
            .insert({
                id: data.user.id,
                email: email,
                name: name,
                app_id: appId,
                plan: 'Free',
                created_at: new Date()
            });

        if (profileError) console.error('Error creating profile:', profileError);

        return { success: true, user: data.user };
    }

    async signOut() {
        if (!this.client) return { success: false };
        const { error } = await this.client.auth.signOut();
        return { success: !error };
    }

    async getCurrentUser() {
        if (!this.client) return null;

        const { data: { user } } = await this.client.auth.getUser();
        if (!user) return null;

        const { data: profile } = await this.client
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return { ...user, ...profile };
    }

    async generateAppId() {
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    async changePassword(userId, currentPassword, newPassword) {
        if (!this.client) return { success: false };

        const { error } = await this.client.auth.updateUser({
            password: newPassword
        });

        if (error) return { success: false, message: error.message };

        // Update password last changed timestamp
        await this.client
            .from('users')
            .update({ password_last_changed: new Date() })
            .eq('id', userId);

        return { success: true };
    }
}

window.SupabaseService = SupabaseService;
>>>>>>> a2c094230c7443797f5e0a66539d1b5662a108a7
