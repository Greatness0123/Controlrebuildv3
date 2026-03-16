const { ipcMain, screen } = require('electron');
const supabase = require('./supabase-service');
const deviceManager = require('./device-manager');
const { mouse, keyboard, Button, Point, Key } = require("@computer-use/nut-js");
const { desktopCapturer } = require('electron');
const os = require('os');

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
    }

    async checkAndAutoStart() {
        const user = supabase.checkCachedUser();
        if (!user) {
            console.log('[Remote] No cached user found, skipping auto-start');
            return;
        }

        // Auto-start if previously enabled in settings
        const settings = this.settingsManager.getSettings();
        if (settings.remoteAccessEnabled) {
            console.log(`[Remote] Auto-starting remote access for user: ${user.id}`);
            await this.toggleRemoteAccess(true);
            
            // Sync pairing status if it exists
            const pairing = deviceManager.getPairingData();
            if (pairing?.id) {
                try {
                    const { data } = await supabase.supabase
                        .from('paired_devices')
                        .select('status')
                        .eq('id', pairing.id)
                        .single();
                    
                    if (data && data.status !== pairing.status) {
                        pairing.status = data.status;
                        deviceManager.setPairingData(pairing);
                    }
                } catch (err) {
                    console.warn('[Remote] Failed to sync device status:', err.message);
                }
            }
        }
    }

    setupIPCHandlers() {
        ipcMain.handle('get-remote-pairing-code', async (event, deviceName, forceRegenerate = false) => {
            const user = supabase.checkCachedUser();
            if (!user) return null;

            const existing = deviceManager.getPairingData();
            
            // If we have an existing code and it's not a force-regeneration, return it
            if (existing && existing.pairing_code && !forceRegenerate) {
                console.log(`[Remote] Returning permanent pairing code: ${existing.pairing_code}`);
                return existing.pairing_code;
            }

            // Surgical Revocation: Only revoke THIS device's previous record if forceRegenerate is true
            if (forceRegenerate && existing?.id) {
                console.log(`[Remote] Force regenerating code for this device. Revoking old pairing: ${existing.id}`);
                try {
                    await supabase.updateDeviceStatus(existing.id, 'revoked');
                    deviceManager.clearPairing();
                } catch (err) {
                    console.error('[Remote] Failed to revoke old device:', err.message);
                }
            }

            // Generate a brand new code for this system
            const res = await supabase.generateDevicePairingCode(user.id, deviceName || os.hostname() || 'Control Desktop');
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
        
        ipcMain.handle('get-remote-status', async () => {
            const pairing = deviceManager.getPairingData();
            const settings = this.settingsManager.getSettings();
            const channelActive = !!(this.channel && this.channel.state === 'joined');

            // If we have a pending pairing, try to sync its status occasionally
            if (pairing?.id && pairing.status !== 'paired') {
                const now = Date.now();
                if (!this._lastSync || now - this._lastSync > 5000) { // Every 5s
                    this._lastSync = now;
                    try {
                        const { data } = await supabase.supabase
                            .from('paired_devices')
                            .select('status')
                            .eq('id', pairing.id)
                            .single();
                        if (data && data.status !== pairing.status) {
                            console.log(`[Remote] Pairing status synced: ${data.status}`);
                            pairing.status = data.status;
                            deviceManager.setPairingData(pairing);
                        }
                    } catch (e) {
                        console.warn('[Remote] Background sync failed:', e.message);
                    }
                }
            }

            return { 
                enabled: channelActive, 
                toggleOn: !!settings.remoteAccessEnabled,
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

    async startSignalingListener(userId, retryCount = 0) {
        if (supabase.initSupabase) supabase.initSupabase();
        if (!supabase.supabase) {
            console.error('[Remote] Cannot start signaling: Supabase not initialized');
            return;
        }
        // Cleanup and health check
        if (this.channel) {
            if (this.channel.state === 'joined' && !retryCount) {
                console.log('[Remote] Signaling listener already active and joined.');
                return;
            }
            console.log('[Remote] Cleaning up existing channel before reconnect...');
            await this.channel.unsubscribe();
            this.channel = null;
        }

        const pairing = deviceManager.getPairingData();
        const listenerId = pairing ? pairing.id : userId;

        console.log(`[Remote] Starting signaling listener for ID: ${listenerId} (Attempt ${retryCount + 1})`);

        this.channel = supabase.supabase
            .channel(`remote_control:${listenerId}`)
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel.presenceState();
                console.log(`[Remote] Presence state updated for ${listenerId}:`, Object.keys(state).length, 'participants');
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('[Remote] Participant joined:', key, newPresences);
            })
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
            .on('system', { event: '*' }, (payload) => {
                console.log('[Remote] Channel system event:', payload);
            })
            .subscribe(async (status, err) => {
                console.log(`[Remote] Subscription status for ${listenerId}: ${status}`);
                if (err) console.error('[Remote] Subscription error:', err);

                if (status === 'SUBSCRIBED') {
                    console.log(`[Remote] Subscribed successfully to: ${listenerId}`);
                    
                    try {
                        const trackRes = await this.channel.track({
                            online_at: new Date().toISOString(),
                            user_id: userId,
                            device_id: listenerId,
                            type: 'desktop',
                            version: '1.1.1'
                        });
                        console.log('[Remote] Presence track result:', trackRes);
                    } catch (trackErr) {
                        console.error('[Remote] Presence track failed:', trackErr);
                    }

                    this.startHeartbeat(pairing?.id);
                } else if (status === 'TIMED_OUT') {
                    console.warn('[Remote] Connection timed out. Retrying in 5s...');
                    setTimeout(() => {
                        if (retryCount < 10) this.startSignalingListener(userId, retryCount + 1);
                    }, 5000);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Remote] Channel error. Retrying in 10s...');
                    setTimeout(() => {
                        if (retryCount < 5) this.startSignalingListener(userId, retryCount + 1);
                    }, 10000);
                }
            }, 30000); // Increased timeout to 30s
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

    async sendFrame() {
        try {
            const sources = await desktopCapturer.getSources({ 
                types: ['screen'], 
                thumbnailSize: { width: 1920, height: 1080 } 
            });
            
            if (sources.length > 0) {
                const screenshot = sources[0].thumbnail.toDataURL();
                
                if (this.channel) {
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
    }

    startStreaming(userId) {
        if (this.isStreaming) {
            // If already streaming, send one frame immediately to sync
            this.sendFrame();
            return;
        }
        
        this.isStreaming = true;
        console.log('[Remote] Starting screen stream...');

        // First frame immediately
        this.sendFrame();

        this.streamInterval = setInterval(() => {
            this.sendFrame();
        }, 110); // ~9 FPS
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
