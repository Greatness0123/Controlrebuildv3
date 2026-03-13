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
        if (!supabase.supabase) return;

        console.log(`[Remote] Starting signaling listener for user: ${userId}`);

        this.channel = supabase.supabase
            .channel(`remote_signaling:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'remote_signaling',
                filter: `target=eq.desktop AND user_id=eq.${userId}`
            }, payload => {
                this.handleSignalingMessage(payload.new);
            })
            .subscribe();
    }

    async handleSignalingMessage(message) {
        const { payload } = message;
        console.log(`[Remote] Received signaling message: ${payload.type}`);

        const { mouse, keyboard, Button, Point, Key } = require("@computer-use/nut-js");
        const { screen } = require("electron");

        try {
            switch (payload.type) {
                case 'mouse_move':
                    const primary = screen.getPrimaryDisplay();
                    const x = Math.round((payload.x / 1000) * primary.bounds.width);
                    const y = Math.round((payload.y / 1000) * primary.bounds.height);
                    await mouse.setPosition(new Point(x, y));
                    break;
                case 'click':
                    await mouse.leftClick();
                    break;
                case 'key_press':
                    if (payload.key) await keyboard.type(payload.key);
                    break;
            }
        } catch (e) {
            console.error('[Remote] Error executing remote action:', e);
        }
    }

    stopSignalingListener() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        console.log('[Remote] Stopped signaling listener');
    }
}

module.exports = RemoteDesktopManager;
