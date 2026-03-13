// Simple browser-side Supabase helper. Expects supabase-js v2 CDN to be loaded
// which exposes `window.supabase`.

// Supabase Configuration (replace with your real project values)
const supabaseUrl = window.SUPABASE_URL || 'https://gdvitudsmqktiutyyndv.supabase.co';
const supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkdml0dWRzbXFrdGl1dHl5bmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIxNjAsImV4cCI6MjA4ODkxODE2MH0.uxN2Obtx2EeErFK8sNMW15xpOMf8FSToiozX0vT_f1Q';

// Initialize Supabase Client using global `supabase` from CDN
const supabaseClient = window.supabase
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

// User management functions
async function getUserById(userId) {
    try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return {
            success: true,
            user: data
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

async function createUser(userData) {
    try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        // NOTE: Under RLS, creating a profile row should happen AFTER an authenticated signup,
        // so auth_id can be set and the INSERT policy can validate ownership.
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{
                ...userData,
                tasks_completed: 0,
                hours_saved: 0,
                success_rate: 0,
                is_active: true
            }]);

        if (error) throw error;

        return {
            success: true,
            user: data
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

async function updateUser(userId, updateData) {
    try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { error } = await supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) throw error;

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

async function loginWithEmailPassword(email, password) {
    try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Fetch user profile from public.users
        const { data: profile, error: profileError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();

        if (profileError) throw profileError;

        return {
            success: true,
            user: profile,
            session: data.session
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

function generateEntryId() {
    // Generate 12-digit numeric string
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}

// Expose a small service class on window for login.js/signup.js
window.SupabaseService = class SupabaseService {
    async signUpWithEmailPassword(email, password) {
        try {
            if (!supabaseClient) throw new Error('Supabase client not initialized');
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    async loginWithEmailPassword(email, password) {
        return await loginWithEmailPassword(email, password);
    }

    async getUserById(userId) {
        return await getUserById(userId);
    }

    async createUser(userData) {
        return await createUser(userData);
    }

    async updateUser(userId, updateData) {
        return await updateUser(userId, updateData);
    }

    async generateUserId() {
        return generateEntryId();
    }
};
