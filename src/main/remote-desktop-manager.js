const { ipcMain, screen } = require('electron');
const supabase = require('./supabase-service');
const { mouse, keyboard, Button, Point, Key, stealth } = require("@computer-use/nut-js");
const { desktopCapturer } = require('electron');

/**
 * RemoteDesktopManager handles the secure pairing, real-time screen streaming,
 * and remote execution of actions on the host machine.
 */
class RemoteDesktopManager {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.currentSession = null;
        this.pairingCode = null;
        this.isStreaming = false;
        this.streamInterval = null;
        this.setupIPCHandlers();
        
        // Optimize nut-js for fluidity
        mouse.config.mouseSpeed = 1000;
        keyboard.config.autoDelayMs = 0;
    }

    setupIPCHandlers() {
        ipcMain.handle('get-remote-pairing-code', async (event, deviceName) => {
            const user = supabase.checkCachedUser();
            if (!user) return null;
            return await supabase.generateDevicePairingCode(user.id, deviceName || 'Control Desktop');
        });

        ipcMain.handle('toggle-remote-access', async (event, enabled) => {
            return await this.toggleRemoteAccess(enabled);
        });
        
        ipcMain.handle('get-remote-status', () => {
            return { enabled: !!this.channel, streaming: this.isStreaming };
        });
    }

    async toggleRemoteAccess(enabled) {
        const user = supabase.checkCachedUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        try {
            if (enabled) {
                this.startSignalingListener(user.id);
                this.startStreaming(user.id);
            } else {
                this.stopSignalingListener();
                this.stopStreaming();
            }
            return { success: true, enabled };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    startSignalingListener(userId) {
        if (!supabase.supabase || this.channel) return;

        console.log(`[Remote] Starting signaling listener for user: ${userId}`);

        this.channel = supabase.supabase
            .channel(`remote_control:${userId}`)
            .on('broadcast', { event: 'action' }, async payload => {
                await this.handleRemoteAction(payload.payload);
            })
            .subscribe();
    }

    async handleRemoteAction(action) {
        console.log(`[Remote] Executing action: ${action.type}`);
        try {
            const primary = screen.getPrimaryDisplay();
            const { width, height } = primary.bounds;

            switch (action.type) {
                case 'mouse_move':
                    const x = Math.round((action.x / 1000) * width);
                    const y = Math.round((action.y / 1000) * height);
                    await mouse.setPosition(new Point(x, y));
                    break;
                case 'click':
                    if (action.button === 'right') await mouse.rightClick();
                    else await mouse.leftClick();
                    break;
                case 'double_click':
                    await mouse.doubleClick(Button.LEFT);
                    break;
                case 'drag':
                    const dx = Math.round((action.x / 1000) * width);
                    const dy = Math.round((action.y / 1000) * height);
                    await mouse.drag(new Point(dx, dy));
                    break;
                case 'key_press':
                    if (action.key) {
                        // Map special keys if needed or just type
                        if (action.key.length > 1) {
                            // Handle Key.Enter, Key.Escape etc if mapped from web
                            const keyName = action.key.toUpperCase();
                            if (Key[keyName]) await keyboard.pressKey(Key[keyName]);
                            await keyboard.releaseKey(Key[keyName]);
                        } else {
                            await keyboard.type(action.key);
                        }
                    }
                    break;
                case 'scroll':
                    if (action.direction === 'down') await mouse.scrollDown(action.amount || 100);
                    else await mouse.scrollUp(action.amount || 100);
                    break;
            }
        } catch (e) {
            console.error('[Remote] Action execution error:', e);
        }
    }

    startStreaming(userId) {
        if (this.isStreaming) return;
        this.isStreaming = true;
        console.log('[Remote] Starting screen stream...');

        // Stream at ~5-10 FPS (adjustable based on performance)
        this.streamInterval = setInterval(async () => {
            try {
                const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1280, height: 720 } });
                if (sources.length > 0) {
                    const screenshot = sources[0].thumbnail.toDataURL(); // toDataURL is standard for broad compatibility
                    
                    // Push via Supabase Realtime Broadcast for lowest latency
                    if (this.channel && this.channel.state === 'joined') {
                        this.channel.send({
                            type: 'broadcast',
                            event: 'screen_update',
                            payload: { image: screenshot, timestamp: Date.now() }
                        });
                    }
                }
            } catch (err) {
                console.error('[Remote] Streaming error:', err);
            }
        }, 200); // 200ms = 5 FPS
    }

    stopStreaming() {
        this.isStreaming = false;
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
        console.log('[Remote] Stopped screen stream');
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
