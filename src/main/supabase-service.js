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

const initSupabase = () => {
    if (supabase) return true;
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });
            console.log('✓ Supabase Client initialized (stateless mode)');
            return true;
        }
    } catch (error) {
        console.error('✗ Failed to initialize Supabase:', error.message);
    }
    return false;
};

// Initial attempt
initSupabase();

module.exports = {
    get supabase() { return supabase; },
    initSupabase,

    async verifyEntryID(entryId) {
        try {
            if (!initSupabase()) return { success: false, message: 'Supabase not initialized' };

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

    async login(email, password) {
        try {
            if (!initSupabase()) return { success: false, message: 'Supabase not initialized' };

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Fetch the 12-digit ID from users table using the auth_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', data.user.id)
                .single();

            if (userError || !userData) {
                return { success: false, message: 'User profile not found in database.' };
            }

            const mappedUser = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                plan: userData.plan,
                tasksCompleted: userData.tasks_completed,
                hoursSaved: userData.hours_saved,
                successRate: userData.success_rate,
                picovoiceKey: userData.picovoice_key,
                aiSettings: userData.ai_settings,
                appSettings: userData.app_settings,
                actCount: userData.act_count,
                askCount: userData.ask_count
            };

            this.cacheUser(mappedUser);
            return { success: true, user: mappedUser };
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

    async generateDevicePairingCode(userId, deviceName) {
        let lastError = null;
        for (let i = 0; i < 3; i++) {
            try {
                if (!supabase) return null;
                
                const code = Math.random().toString(36).substring(2, 8).toUpperCase();

                console.log(`[Supabase] Generating code for User: ${userId}`);
                console.log(`[Supabase] Attempting to generate permanent pairing code (attempt ${i + 1}/3)...`);
                
                const { data, error } = await supabase
                    .from('paired_devices')
                    .insert({
                        user_id: userId,
                        name: deviceName,
                        pairing_code: code,
                        status: 'pending'
                    })
                    .select();

                if (error) {
                    if (error.code === '23503') {
                        throw new Error(`User ID ${userId} not found in database. Please run the registration SQL.`);
                    }
                    throw error;
                }

                // Also store code on the user record so the web can look it up
                await supabase
                    .from('users')
                    .update({ remote_pairing_code: code })
                    .eq('id', userId);

                console.log(`[Supabase] Permanent pairing code generated and saved to user: ${code}`);
                return {
                    code: code,
                    device_id: data && data[0] ? data[0].id : null
                };
            } catch (error) {
                lastError = error;
                console.warn(`[Supabase] Pairing code generation attempt ${i + 1} failed:`, error.message);
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
        console.error('Error generating pairing code after 3 attempts:', lastError);
        return null;
    },

    async updateDeviceStatus(deviceId, status) {
        try {
            if (!supabase) return { success: false, status: 'off' };
            
            // First check if it's already revoked
            const { data: existing } = await supabase
                .from('paired_devices')
                .select('status')
                .eq('id', deviceId)
                .single();

            if (existing && existing.status === 'revoked') {
                return { success: false, status: 'revoked' };
            }

            const { data, error } = await supabase
                .from('paired_devices')
                .update({ 
                    status: status || existing?.status || 'paired',
                    last_seen: new Date().toISOString()
                })
                .eq('id', deviceId)
                .select('status')
                .single();

            if (error) throw error;
            return { success: true, status: data.status };
        } catch (e) {
            console.error('[Supabase] Update status error:', e.message);
            return { success: false, status: 'error' };
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
        try {
            if (!supabase) return { allowed: true };

            const { data: user, error } = await supabase
                .from('users')
                .select('plan, act_count, ask_count')
                .eq('id', userId)
                .single();

            if (error || !user) return { allowed: true };

            const limits = {
                'Free': { act: 10, ask: 50 },
                'Pro': { act: 500, ask: 2000 },
                'Master': { act: 5000, ask: 10000 }
            };

            const planLimits = limits[user.plan] || limits['Free'];
            const currentCount = mode === 'act' ? user.act_count : user.ask_count;
            const limit = mode === 'act' ? planLimits.act : planLimits.ask;

            if (currentCount >= limit) {
                return {
                    allowed: false,
                    error: `Monthly ${mode.toUpperCase()} limit reached for your ${user.plan} plan. Upgrade for more access.`
                };
            }

            return { allowed: true };
        } catch (e) {
            console.error('Rate limit check error:', e);
            return { allowed: true };
        }
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
    },

    async signOut() {
        try {
            if (supabase) {
                await supabase.auth.signOut();
            }
        } catch (e) {}
        this.clearCachedUser();
    }
};
