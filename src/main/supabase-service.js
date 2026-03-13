const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const getCacheFile = () => {
    const { app } = require('electron');
    return path.join(app.getPath('userData'), 'cached_user.json');
};

const getKeysCacheFile = () => {
    const { app } = require('electron');
    return path.join(app.getPath('userData'), 'api_keys.json');
};

let supabase = null;

// Initialize Supabase
try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✓ Supabase Client initialized');
    } else {
        console.warn('! Supabase environment variables missing');
    }
} catch (error) {
    console.error('✗ Failed to initialize Supabase:', error.message);
}

module.exports = {
    supabase,

    async verifyEntryID(entryId) {
        try {
            if (!supabase) return { success: false, message: 'Supabase not initialized' };

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', entryId)
                .single();

            if (error || !data) {
                return { success: false, message: 'Entry ID not found.' };
            }

            if (!data.is_active) {
                return { success: false, message: 'Account deactivated.' };
            }

            const userData = {
                id: data.id,
                name: data.name,
                email: data.email,
                plan: data.plan,
                tasksCompleted: data.tasks_completed,
                // ... map other fields
            };

            this.cacheUser(userData);
            return { success: true, user: userData };

        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    cacheUser(userData) {
        try {
            const cacheFile = getCacheFile();
            fs.writeFileSync(cacheFile, JSON.stringify(userData));
        } catch (e) {}
    },

    checkCachedUser() {
        try {
            const cacheFile = getCacheFile();
            if (fs.existsSync(cacheFile)) {
                return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            }
        } catch (e) {}
        return null;
    },

    async fetchAndCacheKeys() {
        try {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'api_keys')
                .single();

            if (data) {
                fs.writeFileSync(getKeysCacheFile(), JSON.stringify(data.value));
                return data.value;
            }
        } catch (e) {}
        return null;
    },

    getKeys() {
        try {
            if (fs.existsSync(getKeysCacheFile())) {
                return JSON.parse(fs.readFileSync(getKeysCacheFile(), 'utf8'));
            }
        } catch (e) {}
        return null;
    }
};
