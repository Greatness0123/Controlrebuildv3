const { ipcMain } = require('electron');
const supabase = require('./supabase-service');

/**
 * RemoteDesktopManager handles the secure pairing and signaling for the
 * "View and Control" feature, allowing the web app to control this host.
 */
class RemoteDesktopManager {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.currentSession = null;
        this.pairingCode = null;
        this.setupIPCHandlers();
    }

    setupIPCHandlers() {
        ipcMain.handle('get-remote-pairing-code', async () => {
            return await this.generatePairingCode();
        });

        ipcMain.handle('toggle-remote-access', async (event, enabled) => {
            return await this.toggleRemoteAccess(enabled);
        });
    }

    async generatePairingCode() {
        // Generate a secure 8-character pairing code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        this.pairingCode = code;

        // Store in Supabase for the current user to allow web lookup
        const user = supabase.checkCachedUser();
        if (user) {
            await supabase.updateUser(user.id, {
                remote_pairing_code: code,
                remote_pairing_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min expiry
            });
        }

        return code;
    }

    async toggleRemoteAccess(enabled) {
        const user = supabase.checkCachedUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        try {
            await supabase.updateUser(user.id, { remote_access_enabled: enabled });

            if (enabled) {
                this.startSignalingListener(user.id);
            } else {
                this.stopSignalingListener();
            }

            return { success: true, enabled };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    startSignalingListener(userId) {
        // In a real implementation, this would use Supabase Realtime
        // to listen for 'signaling' records from the web client.
        console.log(`[Remote] Listening for signaling messages for user: ${userId}`);
    }

    stopSignalingListener() {
        console.log('[Remote] Stopped signaling listener');
    }
}

module.exports = RemoteDesktopManager;
