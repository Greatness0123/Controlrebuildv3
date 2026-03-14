const { ipcMain, screen } = require('electron');
const supabase = require('./supabase-service');
const deviceManager = require('./device-manager');
const { mouse, keyboard, Button, Point, Key } = require("@computer-use/nut-js");
const { desktopCapturer } = require('electron');

/**
 * RemoteDesktopManager handles the secure pairing, real-time screen streaming,
 * and remote execution of actions on the host machine.
 */
class RemoteDesktopManager {
    constructor(windowManager, settingsManager) {
        this.windowManager = windowManager;
        this.settingsManager = settingsManager;
        this.currentSession = null;
        this.isStreaming = false;
        this.streamInterval = null;
        this.heartbeatInterval = null;
        this.channel = null;
        
        this.setupIPCHandlers();
        
        // Optimize nut-js for fluidity
        mouse.config.mouseSpeed = 1000;
        keyboard.config.autoDelayMs = 0;

        // Auto-start if previously enabled
        setTimeout(() => this.checkAndAutoStart(), 2000);
    }

    async checkAndAutoStart() {
        let pairing = deviceManager.getPairingData();
        if (!pairing || !pairing.id) return;

        // Sync actual status from DB
        try {
            const { data } = await supabase.supabase
                .from('paired_devices')
                .select('status')
                .eq('id', pairing.id)
                .single();
            
            if (data && data.status !== pairing.status) {
                console.log(`[Remote] Syncing device status from DB: ${pairing.status} -> ${data.status}`);
                pairing.status = data.status;
                deviceManager.setPairingData(pairing);
            }
        } catch (err) {
            console.warn('[Remote] Failed to sync device status on startup:', err.message);
        }

        if (pairing.status === 'paired') {
            const settings = this.settingsManager.getSettings();
            if (settings.remoteAccessEnabled) {
                console.log('[Remote] Auto-starting remote access...');
                await this.toggleRemoteAccess(true);
            }
        }
    }

    setupIPCHandlers() {
        ipcMain.handle('get-remote-pairing-code', async (event, deviceName) => {
            const user = supabase.checkCachedUser();
            if (!user) return null;

            // If we already have a code locked to this device, always return it
            const existing = deviceManager.getPairingData();
            if (existing && existing.pairing_code) {
                console.log(`[Remote] Returning permanent pairing code: ${existing.pairing_code}`);
                return existing.pairing_code;
            }

            // First time — generate a new permanent code
            const res = await supabase.generateDevicePairingCode(user.id, deviceName || 'Control Desktop');
            if (res && res.code) {
                deviceManager.setPairingData({
                    id: res.device_id,
                    pairing_code: res.code,
                    status: 'pending'
                });
                return res.code;
            }
            return null;
        });

        ipcMain.handle('toggle-remote-access', async (event, enabled) => {
            // Save state in settings
            this.settingsManager.updateSettings({ remoteAccessEnabled: enabled });
            return await this.toggleRemoteAccess(enabled);
        });
        
        ipcMain.handle('get-remote-status', () => {
            const pairing = deviceManager.getPairingData();
            const channelActive = !!(this.channel && this.channel.state === 'joined');
            return { 
                enabled: channelActive, 
                streaming: this.isStreaming,
                paired: deviceManager.isPaired(),
                deviceId: deviceManager.getDeviceId(),
                pairing: pairing
            };
        });
    }

    async toggleRemoteAccess(enabled) {
        const user = supabase.checkCachedUser();
        if (!user) return { success: false, message: 'Not authenticated' };

        try {
            if (enabled) {
                this.startSignalingListener(user.id);
                // We don't auto-start streaming here to save bandwidth. 
                // We wait for 'request_stream' from the web.
            } else {
                this.stopSignalingListener();
                this.stopStreaming();
            }
            return { success: true, enabled };
        } catch (error) {
            console.error('[Remote] Toggle error:', error);
            return { success: false, message: error.message };
        }
    }

    startSignalingListener(userId) {
        if (!supabase.supabase || this.channel) return;

        const pairing = deviceManager.getPairingData();
        const listenerId = pairing ? pairing.id : userId; // Prefer device-specific channel

        console.log(`[Remote] Starting signaling listener for ID: ${listenerId}`);

        this.channel = supabase.supabase
            .channel(`remote_control:${listenerId}`)
            .on('broadcast', { event: 'action' }, async payload => {
                await this.handleRemoteAction(payload.payload);
            })
            .on('broadcast', { event: 'request_stream' }, () => {
                console.log('[Remote] Stream requested by web');
                this.startStreaming(userId);
            })
            .on('broadcast', { event: 'stop_stream' }, () => {
                console.log('[Remote] Stream stop requested by web');
                this.stopStreaming();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Remote] Subscribed to signaling channel: ${listenerId}`);
                    this.startHeartbeat(pairing?.id);
                }
            });
    }

    async startHeartbeat(deviceId) {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (!deviceId) return;

        console.log(`[Remote] Starting heartbeat for device: ${deviceId}`);
        
        const checkStatus = async () => {
            const res = await supabase.updateDeviceStatus(deviceId, 'paired');
            if (res.status === 'revoked') {
                console.warn('[Remote] Device access revoked from web. Stopping...');
                deviceManager.setPairingData({ ...deviceManager.getPairingData(), status: 'revoked' });
                await this.toggleRemoteAccess(false);
                return false;
            }
            return true;
        };

        // Initial check
        if (!await checkStatus()) return;
        
        this.heartbeatInterval = setInterval(async () => {
            if (!await checkStatus()) {
                clearInterval(this.heartbeatInterval);
            }
        }, 30000); // Heartbeat every 30s
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
                    if (action.x !== undefined && action.y !== undefined) {
                        const cx = Math.round((action.x / 1000) * width);
                        const cy = Math.round((action.y / 1000) * height);
                        await mouse.setPosition(new Point(cx, cy));
                    }
                    if (action.button === 'right') await mouse.rightClick();
                    else await mouse.leftClick();
                    break;
                case 'double_click':
                    if (action.x !== undefined && action.y !== undefined) {
                        const dcx = Math.round((action.x / 1000) * width);
                        const dcy = Math.round((action.y / 1000) * height);
                        await mouse.setPosition(new Point(dcx, dcy));
                    }
                    await mouse.doubleClick(Button.LEFT);
                    break;
                case 'drag':
                    const dx = Math.round((action.x / 1000) * width);
                    const dy = Math.round((action.y / 1000) * height);
                    await mouse.drag(new Point(dx, dy));
                    break;
                case 'key_press':
                    if (action.key) {
                        if (action.key.length > 1) {
                            const keyName = action.key.toUpperCase();
                            if (Key[keyName]) {
                                await keyboard.pressKey(Key[keyName]);
                                await keyboard.releaseKey(Key[keyName]);
                            }
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

        this.streamInterval = setInterval(async () => {
            try {
                // Higher quality thumbnail for better visibility
                const sources = await desktopCapturer.getSources({ 
                    types: ['screen'], 
                    thumbnailSize: { width: 1920, height: 1080 } 
                });
                
                if (sources.length > 0) {
                    const screenshot = sources[0].thumbnail.toDataURL();
                    
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
        }, 150); // ~6.6 FPS
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
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        console.log('[Remote] Stopped signaling listener');
    }
}

module.exports = RemoteDesktopManager;
