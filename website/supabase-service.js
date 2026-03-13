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
