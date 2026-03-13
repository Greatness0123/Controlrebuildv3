// Supabase Configuration
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase Client
const supabase = supabaseJS.createClient(supabaseUrl, supabaseKey);

// User management functions
export async function getUserById(userId) {
    try {
        const { data, error } = await supabase
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

export async function createUser(userData) {
    try {
        const entryId = generateEntryId();
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: entryId,
                ...userData,
                tasks_completed: 0,
                hours_saved: 0,
                success_rate: 0,
                is_active: true
            }])
            .select()
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

export async function updateUser(userId, updateData) {
    try {
        const { error } = await supabase
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

export async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Fetch user profile from public.users
        const { data: profile, error: profileError } = await supabase
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

export function generateEntryId() {
    // Generate 12-digit numeric string
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}
