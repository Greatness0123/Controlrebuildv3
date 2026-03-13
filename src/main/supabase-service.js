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
                hoursSaved: data.hours_saved,
                successRate: data.success_rate,
                picovoiceKey: data.picovoice_key,
                aiSettings: data.ai_settings,
                appSettings: data.app_settings,
                actCount: data.act_count,
                askCount: data.ask_count
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
    },

    async updateUserSettings(userId, settings) {
        try {
            if (!supabase) return { success: false };

            const { error } = await supabase
                .from('users')
                .update({
                    ai_settings: settings.aiSettings,
                    app_settings: settings.appSettings
                })
                .eq('id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating user settings:', error);
            return { success: false, message: error.message };
        }
    },

    async updateUser(userId, data) {
        try {
            if (!supabase) return { success: false };

            const updateData = {};
            if (data.name) updateData.name = data.name;
            if (data.picovoiceKey) updateData.picovoice_key = data.picovoiceKey;
            if (data.tasksCompleted) updateData.tasks_completed = data.tasksCompleted;
            if (data.remote_pairing_code) updateData.remote_pairing_code = data.remote_pairing_code;
            if (data.remote_pairing_expires) updateData.remote_pairing_expires = data.remote_pairing_expires;
            if (data.remote_access_enabled !== undefined) updateData.remote_access_enabled = data.remote_access_enabled;

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, message: error.message };
        }
    },

    async getGeminiKey(plan) {
        const keys = this.getKeys();
        if (keys && keys.gemini_keys) {
            return keys.gemini_keys[0];
        }
        return null;
    },

    async checkRateLimit(userId, mode) {
        return { allowed: true };
    },

    async incrementTaskCount(userId, mode) {
        try {
            if (!supabase) return;
            const column = mode === 'act' ? 'act_count' : 'ask_count';
            const { data: user } = await supabase.from('users').select(column).eq('id', userId).single();
            if (user) {
                const newVal = (user[column] || 0) + 1;
                await supabase.from('users').update({ [column]: newVal }).eq('id', userId);
            }
        } catch (e) {
            console.error('Error incrementing task count:', e);
        }
    },

    async updateTokenUsage(userId, mode, usage) {
        try {
            if (!supabase || !usage) return;
            const { totalTokenCount } = usage;
            const { data: user } = await supabase.from('users').select('token_usage').eq('id', userId).single();
            const currentUsage = user?.token_usage || {};
            currentUsage[mode] = (currentUsage[mode] || 0) + (totalTokenCount || 0);
            await supabase.from('users').update({ token_usage: currentUsage }).eq('id', userId);
        } catch (e) {
            console.error('Error updating token usage:', e);
        }
    },

    rotateGeminiKey() {
        console.log('Gemini key rotation requested');
    },

    rotateOpenRouterKey() {
        console.log('OpenRouter key rotation requested');
    },

    clearCachedUser() {
        try {
            const cacheFile = getCacheFile();
            if (fs.existsSync(cacheFile)) {
                fs.unlinkSync(cacheFile);
            }
        } catch (e) {}
    }
};
