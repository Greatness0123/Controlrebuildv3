const electron = require('electron');
const { app, BrowserWindow, globalShortcut, ipcMain, screen, shell, Tray, Menu } = electron;
const path = require('path');
const fs = require('fs-extra');

let isDev = false;
try {
    isDev = typeof electron === 'object' && (electron.app ? electron.app.isPackaged === false : false);
    if (!isDev && (process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath))) {
        isDev = true;
    }
} catch (e) {
    isDev = false;
}

const dotenv = require('dotenv');

const possibleEnvPaths = [
    path.join(__dirname, '../../.env'), // Development
];

function loadExtendedEnv() {
    try {
        const extendedPaths = [
            path.join(path.dirname(app.getPath('exe')), '.env'), 
            path.join(app.getPath('userData'), '.env')
        ];
        for (const envPath of extendedPaths) {
            if (fs.existsSync(envPath)) {
                console.log(`[Main] Loading extended environment from: ${envPath}`);
                dotenv.config({ path: envPath, override: false }); // don't override dev .env
            }
        }
    } catch (e) {

    }
}

for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
        console.log(`[Main] Loading environment from: ${envPath}`);
        dotenv.config({ path: envPath });
        break;
    }
}

const { spawn } = require('child_process');
app.disableHardwareAcceleration();

setTimeout(loadExtendedEnv, 0);

process.on('uncaughtException', (error) => {
    console.error('[Main] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
});

const WindowManager = require('./window-manager');
const HotkeyManager = require('./hotkey-manager');
const SecurityManager = require('./security-manager-fixed');
const BackendManager = require('./backend-manager-fixed');
const WakewordManager = require('./wakeword-manager');
const EdgeTTSManager = require('./edge-tts');
const VoskServerManager = require('./vosk-server-manager');
const SettingsManager = require('./settings-manager');
const dbService = require('./supabase-service');
const RemoteDesktopManager = require('./remote-desktop-manager');
const workflowManager = require('./workflow-manager');
const appUtils = require('./app-utils');
const electronBrowserManager = require('./electron-browser-manager');

class ComputerUseAgent {
    constructor() {
        this.isReady = false;
        this.isQuitting = false;
        this.isAuthenticated = false; // ✅ NEW: Track authentication state
        this.tray = null;

        this.windowManager = new WindowManager();
        global.windowManager = this.windowManager; // Required for BackendManager broadcasting
        this.hotkeyManager = new HotkeyManager();
        this.securityManager = new SecurityManager();
        this.backendManager = new BackendManager();
        this.wakewordManager = new WakewordManager();
        this.workflowQueue = [];
        this.isProcessingQueue = false;
        this.edgeTTS = new EdgeTTSManager();
        this.voskServerManager = new VoskServerManager();
        this.settingsManager = new SettingsManager();
        this.remoteDesktopManager = new RemoteDesktopManager(this.windowManager, this.settingsManager);

        this.appSettings = this.settingsManager.getSettings();

        if (this.appSettings.autoSendAfterWakeWord === undefined) {
            this.appSettings.autoSendAfterWakeWord = false;
        }
        if (!this.appSettings.lastMode) {
            this.appSettings.lastMode = 'act';
        }
        if (this.appSettings.windowVisibility === undefined) {
            this.appSettings.windowVisibility = true;
        }
        if (this.appSettings.wakeWordToggleChat === undefined) {
            this.appSettings.wakeWordToggleChat = false;
        }

        global.appSettings = this.appSettings;

        this.setupEventHandlers();
        this.setupIPCHandlers();

        process.on('hotkey-triggered', async (payload) => {
            try {
                const { event, data } = payload;
                console.log(`[Main] hotkey-triggered: ${event}`, data || '');

                switch (event) {
                    case 'wakeword-detected':

                        const settingsWin = this.windowManager.getWindow('settings');
                        if (settingsWin && settingsWin.isVisible()) {
                            this.windowManager.hideWindow('settings');
                        }

                        const workflowWin = this.windowManager.getWindow('workflow');
                        if (workflowWin && workflowWin.isVisible()) {
                            this.windowManager.hideWindow('workflow');
                        }

                        if (this.securityManager && this.securityManager.isEnabled() && !this.isAuthenticated) {
                            console.log('[Main] PIN required');
                            const mainWin = this.windowManager.getWindow('main');
                            if (mainWin && !mainWin.isDestroyed()) {
                                this.windowManager.setInteractive(true);
                                mainWin.webContents.send('request-pin-and-toggle');
                            }
                        } else {

                            const wasVisible = this.windowManager.chatVisible;

                            if (this.appSettings.wakeWordToggleChat) {

                                await this.windowManager.toggleChat();

                                if (this.windowManager.chatVisible && !wasVisible) {
                                    const chatWin = this.windowManager.getWindow('chat');
                                    if (chatWin && !chatWin.isDestroyed()) {

                                        chatWin.webContents.send('wakeword-detected', { openedChat: true });
                                    }
                                }
                            } else {

                                if (!wasVisible) {

                                    await this.windowManager.showWindow('chat');

                                    const chatWin = this.windowManager.getWindow('chat');
                                    if (chatWin && !chatWin.isDestroyed()) {

                                        chatWin.webContents.send('wakeword-detected', { openedChat: true });
                                    }
                                } else {

                                    const chatWin = this.windowManager.getWindow('chat');
                                    if (chatWin && !chatWin.isDestroyed()) {
                                        chatWin.focus();
                                    }
                                    console.log('[Main] Chat already visible, not starting auto-transcription');
                                }
                            }
                        }
                        break;
                    case 'toggle-chat':
                        console.log('[Main] Toggle chat event received');

                        this.windowManager.hideWindow('settings');
                        this.windowManager.hideWindow('workflow');

                        if (this.securityManager && this.securityManager.isEnabled() && !this.isAuthenticated) {
                            console.log('[Main] PIN required for toggle - requesting authentication');
                            const mainWin = this.windowManager.getWindow('main');
                            if (mainWin && !mainWin.isDestroyed()) {
                                this.windowManager.setInteractive(true);
                                mainWin.webContents.send('request-pin-and-toggle');
                            }
                        } else {
                            console.log('[Main] Toggle chat - proceed to windowManager.toggleChat()');
                            await this.windowManager.toggleChat();
                        }
                        break;
                    case 'stop-action':
                        console.log('[Main] Stop action event received');
                        this.backendManager.stopTask();
                        break;
                    case 'stop-task':
                        console.log('[Main] Stop task event received');
                        this.backendManager.stopTask();
                        break;
                    default:
                        console.log('Unhandled hotkey event:', event);
                }
            } catch (e) {
                console.error('Error handling hotkey event:', e);
            }
        });

        process.on('wakeword-invalid-key', async (payload) => {
            console.warn('[Main] Wakeword invalid key event received:', payload);
            console.log('[Main] Handling wakeword-invalid-key: disabling voiceActivation and notifying renderers');
            try {

                this.settingsManager.updateSettings({ voiceActivation: false });
                this.windowManager.broadcast('settings-updated', this.getSettings());

                this.windowManager.broadcast('porcupine-key-invalid', { message: payload && payload.message ? payload.message : 'Invalid Picovoice key' });
            } catch (e) {
                console.error('[Main] Failed to handle wakeword-invalid-key:', e);
            }
        });

        process.on('wakeword-error', async (payload) => {
            console.error('[Main] Wakeword error event received:', payload);
            try {

                this.settingsManager.updateSettings({ voiceActivation: false });
                this.windowManager.broadcast('settings-updated', this.getSettings());

                this.windowManager.broadcast('wakeword-error', {
                    message: payload && payload.message ? payload.message : 'Wake word detection failed.'
                });
            } catch (e) {
                console.error('[Main] Failed to handle wakeword-error:', e);
            }
        });
    }

    setupEventHandlers() {
        app.whenReady().then(() => this.onAppReady());
        app.on('window-all-closed', () => this.onWindowAllClosed());
        app.on('activate', () => this.onActivate());
        app.on('will-quit', () => this.onWillQuit());
        app.on('before-quit', () => {
            this.isQuitting = true;
            if (this.windowManager) this.windowManager.isQuitting = true;
        });
    }

    async onAppReady() {
        console.log('[Main] app.whenReady() triggered');
        await this.init();
    }

    async handleSuccessfulAuth(userData) {
        console.log('[Main] Handling successful authentication for:', userData.id);
        
        this.isAuthenticated = true;
        this.currentUser = userData;

        this.settingsManager.updateSettings({
            userAuthenticated: true,
            userDetails: userData
        });

        this.windowManager.broadcast('user-changed', userData);
        this.windowManager.broadcast('settings-updated', this.settingsManager.getSettings());

        if (this.remoteDesktopManager) {
            this.remoteDesktopManager.checkAndAutoStart();
        }

        await this.windowManager.showWindow('main');

        if (this.settingsManager.getSettings().windowVisibility !== false) {
            await this.windowManager.toggleChat();
        }

        setTimeout(() => {
            this.windowManager.hideWindow('entry');
        }, 500);
    }

    async init() {
        try {
            console.log('[Main] Control starting (High Concurrency Mode)...');

            const dbKeysPromise = dbService.fetchAndCacheKeys().catch(e => console.warn('[Main] Key fetch error:', e.message));
            const backendStartPromise = this.backendManager.startBackend();
            const voskStartPromise = this.voskServerManager.start();
            const windowInitPromise = this.windowManager.initializeWindows();

            this.setupPermissions();
            if (this.appSettings.voiceResponse) this.edgeTTS.enable(true);

            const cachedUser = dbService.checkCachedUser();
            let userDataPromise = Promise.resolve();

            if (cachedUser) {
                this.isAuthenticated = true;
                this.currentUser = cachedUser;
                this.settingsManager.updateSettings({ userAuthenticated: true, userDetails: cachedUser });

                if (this.remoteDesktopManager) {
                    this.remoteDesktopManager.checkAndAutoStart();
                }

                userDataPromise = dbService.updateUser(cachedUser.id, {}).then(res => {

                    return dbService.verifyEntryID(cachedUser.id);
                }).then(result => {
                    if (result.success) {
                        this.currentUser = result.user;
                        this.settingsManager.updateSettings({ userDetails: this.currentUser });
                        const userKey = this.currentUser.picovoiceKey;
                        if (userKey) process.env.PORCUPINE_ACCESS_KEY = userKey;

                        this.windowManager.broadcast('user-changed', this.currentUser);
                        this.windowManager.broadcast('settings-updated', this.getSettings());
                    }
                    return this.currentUser;
                }).catch(e => {
                    console.warn('[Main] User sync error:', e.message);
                    return cachedUser;
                });
            } else {
                this.isAuthenticated = false;
            }

            await windowInitPromise;

            this.windowManager.showWindow('main');
            await this.windowManager.showWindow('entry');

            const entryWin = this.windowManager.getWindow('entry');
            if (this.isAuthenticated && entryWin) {
                entryWin.minimize();
            }

            this.hotkeyManager.setupHotkeys(this.appSettings.hotkeys);
            this.updateWindowVisibility(this.appSettings.windowVisibility);
            this.startWorkflowScheduler();

            const wakewordStartPromise = (async () => {

                await dbKeysPromise;
                if (this.appSettings.voiceActivation) {
                    return this.wakewordManager.enable(true);
                }
            })();

            Promise.allSettled([
                dbKeysPromise.then(keys => {
                    if (keys?.gemini) process.env.GEMINI_API_KEY = keys.gemini;
                    if (keys?.gemini_model) process.env.GEMINI_MODEL = keys.gemini_model;
                }),
                userDataPromise,
                backendStartPromise,
                voskStartPromise,
                wakewordStartPromise
            ]).then(() => {
                console.log('[Main] All background services and data sync completed');
                this.backendManager.waitForReady();
            });

            this.backendManager.on('ai-stream', (data) => {
                this.windowManager.broadcast('ai-stream', data);
            });

            this.edgeTTS.on('speaking', () => {
                console.log('[Main] Audio started playing');
                const chatWin = this.windowManager.getWindow('chat');
                if (chatWin && !chatWin.isDestroyed()) {
                    chatWin.webContents.send('audio-started', {});
                }
            });

            this.edgeTTS.on('stopped', () => {
                console.log('[Main] Audio segment stopped');

            });

            this.edgeTTS.on('queue-empty', () => {
                console.log('[Main] Audio queue empty');
                const chatWin = this.windowManager.getWindow('chat');
                if (chatWin && !chatWin.isDestroyed()) {
                    chatWin.webContents.send('audio-stopped', { queueEmpty: true });
                }
            });

            this.backendManager.on('ai-response', (data) => {
                console.log('[Main] AI response received');

                this.windowManager.broadcast('ai-response', data);

                if (this.appSettings.voiceResponse && data && data.text) {
                    console.log('[Main] ✓ All conditions met - Speaking AI response');
                    const cleanText = this.cleanMarkdownForTTS(data.text);
                    console.log('[Main] Cleaned text to speak:', cleanText);
                    this.edgeTTS.speak(cleanText);
                } else {
                    console.log('[Main] ✗ Cannot speak response:');
                    console.log('    - voiceResponse enabled:', this.appSettings.voiceResponse);
                    console.log('    - Response has text:', !!(data && data.text));
                    if (data && data.text) {
                        console.log('    - Text content:', data.text);
                    }
                }
            });

            this.backendManager.on('after-message', (data) => {
                console.log('[Main] After-message received from ACT');
                this.windowManager.broadcast('after-message', data);

                if (this.appSettings.voiceResponse && data && data.text) {
                    console.log('[Main] Speaking ACT after-message via EdgeTTS');
                    const cleanText = this.cleanMarkdownForTTS(data.text);
                    this.edgeTTS.speak(cleanText);
                }
            });

            this.setupTray();

            this.isReady = true;
            console.log('[Main] Control initialized successfully');

            const chatWin = this.windowManager.getWindow('chat');
            if (chatWin && !chatWin.isDestroyed()) {

                setTimeout(() => {
                    chatWin.webContents.send('app-initialized', {});
                }, 500);
            }

        } catch (error) {
            console.error('[Main] Application initialization failed:', error);
            app.quit();
        }
    }

    setupPermissions() {

        app.on('web-contents-created', (event, contents) => {
            contents.on('new-window', (event, navigationUrl) => {
                event.preventDefault();
                shell.openExternal(navigationUrl);
            });
        });
    }

    setupIPCHandlers() {

        ipcMain.handle('show-window', async (event, windowType) => {
            await this.windowManager.showWindow(windowType);
            return { success: true };
        });

        ipcMain.handle('hide-window', (event, windowType) => {
            this.windowManager.hideWindow(windowType);
            return { success: true };
        });

        ipcMain.handle('toggle-chat', async () => {
            console.log('[Main] toggle-chat handler called');

            if (this.securityManager && this.securityManager.isEnabled() && !this.isAuthenticated) {
                console.log('[Main] Authentication required, requesting PIN');
                const mainWin = this.windowManager.getWindow('main');
                if (mainWin && !mainWin.isDestroyed()) {
                    this.windowManager.setInteractive(true);
                    mainWin.webContents.send('request-pin-and-toggle');
                }
                return { success: false, needsAuth: true };
            }

            console.log('[Main] Calling windowManager.toggleChat()');
            const result = await this.windowManager.toggleChat();
            console.log('[Main] toggleChat result:', result);
            return result;
        });

        ipcMain.handle('close-window', (event, windowType) => {
            this.windowManager.closeWindow(windowType);
            return { success: true };
        });

        ipcMain.handle('verify-pin', (event, pin) => {
            const result = this.securityManager.verifyPin(pin);
            if (result.valid) {
                this.isAuthenticated = true; // ✅ Set authentication state
                this.windowManager.setOverlayInteractive(false);
                console.log('[Main] PIN verified, user authenticated');
            }
            return result;
        });

        ipcMain.handle('enable-security-pin', async (event, enabled) => {
            try {
                const result = await this.securityManager.enablePin(enabled);

                if (!enabled) {
                    this.isAuthenticated = false;
                }
                return result;
            } catch (err) {
                return { success: false, message: err.message };
            }
        });

        ipcMain.handle('set-security-pin', async (event, pin) => {
            try {
                return await this.securityManager.setPin(pin);
            } catch (err) {
                return { success: false, message: err.message };
            }
        });

        ipcMain.handle('change-pin', async (event, currentPin, newPin) => {
            try {
                return await this.securityManager.changePin(currentPin, newPin);
            } catch (err) {
                return { success: false, message: err.message };
            }
        });

        ipcMain.handle('login-with-email', async (event, email, password) => {
            try {
                const result = await dbService.login(email, password);
                if (result.success) {
                    await this.handleSuccessfulAuth(result.user);
                }
                return result;
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, message: error.message };
            }
        });

        ipcMain.handle('authenticate-user', async (event, userId) => {
            try {
                const result = await dbService.verifyEntryID(userId);
                if (result.success) {
                    await this.handleSuccessfulAuth(result.user);
                }
                return result;
            } catch (error) {
                console.error('Authentication error:', error);
                return { success: false, message: 'Authentication failed. Please try again.' };
            }
        });

        ipcMain.handle('get-user-info', async () => {
            try {
                const settings = this.settingsManager.getSettings();

                if (settings.userAuthenticated && settings.userDetails) {
                    console.log('[Main] Found user details in settings memory');

                    try {
                        const userId = settings.userDetails.id;
                        if (userId) {
                            const timeoutMs = 3000; // do not stall renderer for long
                            const fetchPromise = dbService.verifyEntryID(userId);
                            const timed = await Promise.race([
                                fetchPromise,
                                new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), timeoutMs))
                            ]).catch(err => {
                                console.warn('[Main] Quick DB check for user failed or timed out:', err.message || err);
                                return null;
                            });

                            if (timed && timed.success && timed.user) {
                                console.log('[Main] get-user-info: refreshed user data from DB for', userId);

                                this.settingsManager.updateSettings({ userDetails: timed.user });
                                this.currentUser = timed.user;

                                return {
                                    success: true,
                                    isAuthenticated: true,
                                    ...timed.user
                                };
                            }
                        }
                    } catch (e) {

                        console.warn('[Main] get-user-info: error while checking DB for fresh user:', e.message || e);
                    }

                    return {
                        success: true,
                        isAuthenticated: true,
                        ...settings.userDetails
                    };
                }

                const cachedUser = dbService.checkCachedUser();
                if (cachedUser) {
                    console.log('[Main] Found user details in disk cache (fallback)');

                    this.settingsManager.updateSettings({
                        userAuthenticated: true,
                        userDetails: cachedUser
                    });
                    this.isAuthenticated = true;
                    this.currentUser = cachedUser;

                    return {
                        success: true,
                        isAuthenticated: true,
                        ...cachedUser
                    };
                }

                console.log('[Main] No user info found in memory or cache');
                return {
                    success: false,
                    isAuthenticated: false
                };
            } catch (error) {
                console.error('[Main] get-user-info error:', error);
                return {
                    success: false,
                    isAuthenticated: false
                };
            }
        });

        ipcMain.handle('verify-entry-id', async (event, entryId) => {
            try {
                const result = await dbService.verifyEntryID(entryId);
                if (result.success) {
                    await this.handleSuccessfulAuth(result.user);
                }
                return result;
            } catch (error) {
                console.error('Entry ID verification error:', error);
                return { success: false, message: 'Verification failed. Please try again.' };
            }
        });

        ipcMain.handle('get-picovoice-key', async () => {
            try {
                console.log('[Main] [IPC] get-picovoice-key called');
                const user = this.currentUser || dbService.checkCachedUser();
                const hasKey = !!(user && user.picovoiceKey);
                console.log('[Main] [IPC] get-picovoice-key: userFound=', !!user, 'hasKey=', hasKey);
                return { success: true, key: user ? (user.picovoiceKey || null) : null };
            } catch (e) {
                console.error('[Main] [IPC] get-picovoice-key error:', e);
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('set-picovoice-key', async (event, key) => {
            try {
                console.log('[Main] [IPC] set-picovoice-key called by renderer (user id=', this.currentUser ? this.currentUser.id : 'none', ')');
                if (!this.currentUser || !this.currentUser.id) return { success: false, message: 'Not authenticated' };

                dbService.updateUser(this.currentUser.id, { picovoiceKey: key })
                    .then(res => console.log('[Main] Picovoice key updated in DB:', res.success))
                    .catch(e => console.warn('[Main] DB key update failed, using local only:', e.message));

                this.currentUser.picovoiceKey = key;
                dbService.cacheUser(this.currentUser);

                this.settingsManager.updateSettings({ userDetails: this.currentUser });
                this.windowManager.broadcast('user-changed', this.currentUser);

                process.env.PORCUPINE_ACCESS_KEY = key;
                console.log('[Main] [IPC] Applied picovoice key to process.env');

                this.settingsManager.updateSettings({ voiceActivation: true });
                this.windowManager.broadcast('settings-updated', this.getSettings());

                return { success: true };
            } catch (e) {
                console.error('[Main] [IPC] set-picovoice-key failed:', e);
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('validate-picovoice-key', async (event, key) => {
            try {
                console.log('[Main] [IPC] validate-picovoice-key called (key length=', key ? key.length : 0, ')');
                const WakewordHelper = require('./backends/wakeword-helper');

                const helper = new WakewordHelper({
                    accessKey: key,
                    logger: (msg, level) => this.wakewordManager.logWithDevTools(msg, level)
                });

                const res = await helper.validateAccessKey(key);
                console.log('[Main] [IPC] validate-picovoice-key result:', res);
                return res;
            } catch (e) {
                console.error('[Main] [IPC] validate-picovoice-key error:', e);
                return { success: false, message: `Validation error: ${e.message || 'Unknown error'}` };
            }
        });

        ipcMain.handle('open-external-url', (event, url) => {
            try {
                shell.openExternal(url);
                return { success: true };
            } catch (e) {
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('minimize-window', (event) => {
            const w = BrowserWindow.fromWebContents(event.sender);
            if (w) w.minimize();
            return { success: true };
        });

        ipcMain.handle('maximize-window', (event) => {
            const w = BrowserWindow.fromWebContents(event.sender);
            if (w) {
                if (w.isMaximized()) w.unmaximize(); else w.maximize();
            }
            return { success: true };
        });

        ipcMain.handle('get-app-version', () => {
            return { version: app.getVersion() };
        });

        ipcMain.handle('get-installed-apps', async () => {
            return await appUtils.getInstalledApps();
        });

        ipcMain.handle('get-all-workflows', () => {
            return workflowManager.getAllWorkflows();
        });

        ipcMain.handle('save-workflow', (event, workflow) => {
            return workflowManager.saveWorkflow(workflow);
        });

        ipcMain.handle('delete-workflow', (event, id) => {
            return workflowManager.deleteWorkflow(id);
        });

        ipcMain.handle('toggle-workflow', (event, id, enabled) => {
            return workflowManager.toggleWorkflow(id, enabled);
        });

        ipcMain.handle('pick-item', async (event, type) => {
            const { dialog } = require('electron');
            const window = BrowserWindow.fromWebContents(event.sender);

            let properties = ['openFile'];
            if (type === 'app' && process.platform === 'darwin') {
                properties = ['openFile'];
            } else if (type === 'app') {
                properties = ['openFile']; // On Windows/Linux apps are files
            }

            const result = await dialog.showOpenDialog(window, {
                properties: properties,
                title: `Select ${type}`
            });

            if (!result.canceled && result.filePaths.length > 0) {
                return result.filePaths[0];
            }
            return null;
        });

        ipcMain.handle('execute-workflow', async (event, id) => {
            const workflow = workflowManager.getWorkflowById(id);
            if (workflow) {
                this.executeWorkflow(workflow);
                return { success: true };
            }
            return { success: false, message: 'Workflow not found' };
        });

        ipcMain.handle('export-workflow', async (event, id) => {
            const workflow = workflowManager.getWorkflowById(id);
            if (!workflow) return { success: false, message: 'Workflow not found' };

            const { dialog } = require('electron');
            const window = BrowserWindow.fromWebContents(event.sender);

            const result = await dialog.showSaveDialog(window, {
                title: 'Export Workflow',
                defaultPath: `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}.json`,
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (!result.canceled && result.filePath) {
                try {
                    fs.writeJsonSync(result.filePath, workflow, { spaces: 2 });
                    return { success: true };
                } catch (e) {
                    return { success: false, message: e.message };
                }
            }
            return { success: false };
        });

        ipcMain.handle('import-skill', async (event) => {
            const { dialog } = require('electron');
            const window = BrowserWindow.fromWebContents(event.sender);

            const result = await dialog.showOpenDialog(window, {
                title: 'Import Skill',
                filters: [
                    { name: 'Supported Files', extensions: ['json', 'md', 'txt', 'markdown'] },
                    { name: 'JSON', extensions: ['json'] },
                    { name: 'Markdown', extensions: ['md', 'markdown'] },
                    { name: 'Text', extensions: ['txt'] }
                ],
                properties: ['openFile', 'multiSelections']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const storageManager = require('./storage-manager');
                let totalCount = 0;

                for (const filePath of result.filePaths) {
                    try {
                        const ext = path.extname(filePath).toLowerCase();
                        if (ext === '.json') {
                            const skillData = fs.readJsonSync(filePath);
                            const skills = Array.isArray(skillData) ? skillData : [skillData];
                            for (const skill of skills) {
                                if (storageManager.addBehavior(skill)) totalCount++;
                            }
                        } else if (['.md', '.txt', '.markdown'].includes(ext)) {
                            const content = fs.readFileSync(filePath, 'utf8');

                            const name = path.basename(filePath, ext)
                                .replace(/[^a-zA-Z0-9]/g, ' ')
                                .split(' ')
                                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                .join('');

                            const skill = {
                                name: name,
                                description: `Imported from ${path.basename(filePath)}`,
                                pattern: content.trim()
                            };
                            if (storageManager.addBehavior(skill)) totalCount++;
                        }
                    } catch (e) {
                        console.error(`Failed to import skill from ${filePath}:`, e);
                    }
                }
                if (totalCount > 0) {
                    this.windowManager.broadcast('skills-updated');
                }
                return { success: totalCount > 0, count: totalCount };
            }
            return { success: false };
        });

        ipcMain.handle('upload-skill-folder', async (event) => {
            const { dialog } = require('electron');
            const window = BrowserWindow.fromWebContents(event.sender);

            const result = await dialog.showOpenDialog(window, {
                title: 'Import Skill Folder',
                properties: ['openDirectory']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const storageManager = require('./storage-manager');
                let totalCount = 0;
                const folderPath = result.filePaths[0];

                try {
                    const files = fs.readdirSync(folderPath);
                    for (const file of files) {
                        const filePath = path.join(folderPath, file);
                        if (fs.statSync(filePath).isFile()) {
                            const ext = path.extname(filePath).toLowerCase();
                            if (ext === '.json') {
                                const skillData = fs.readJsonSync(filePath);
                                const skills = Array.isArray(skillData) ? skillData : [skillData];
                                for (const skill of skills) {
                                    if (storageManager.addBehavior(skill)) totalCount++;
                                }
                            } else if (['.md', '.txt', '.markdown'].includes(ext)) {
                                const content = fs.readFileSync(filePath, 'utf8');
                                const name = path.basename(filePath, ext)
                                    .replace(/[^a-zA-Z0-9]/g, ' ')
                                    .split(' ')
                                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                    .join('');

                                const skill = {
                                    name: name,
                                    description: `Imported from ${path.basename(filePath)}`,
                                    pattern: content.trim()
                                };
                                if (storageManager.addBehavior(skill)) totalCount++;
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error reading skill folder:', err);
                    return { success: false, error: 'Failed to read folder contents' };
                }

                if (totalCount > 0) {
                    this.windowManager.broadcast('skills-updated');
                }
                return { success: totalCount > 0, count: totalCount };
            }
            return { success: false };
        });

        ipcMain.handle('delete-skill', async (event, name) => {
            const storageManager = require('./storage-manager');
            const success = storageManager.deleteBehavior(name);
            if (success) {
                this.windowManager.broadcast('skills-updated');
            }
            return { success };
        });

        ipcMain.handle('import-workflow', async (event) => {
            const { dialog } = require('electron');
            const window = BrowserWindow.fromWebContents(event.sender);

            const result = await dialog.showOpenDialog(window, {
                title: 'Import Workflow',
                filters: [{ name: 'JSON', extensions: ['json'] }],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                try {
                    const workflowData = fs.readJsonSync(result.filePaths[0]);
                    const importResult = workflowManager.importWorkflows(workflowData);
                    return importResult;
                } catch (e) {
                    return { success: false, message: 'Invalid workflow file' };
                }
            }
            return { success: false };
        });

        ipcMain.on('close-settings', () => {
            this.windowManager.hideWindow('settings');
        });

        ipcMain.on('window-drag', (event, delta) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window && !window.isDestroyed()) {
                const bounds = window.getBounds();
                window.setPosition(bounds.x + delta.deltaX, bounds.y + delta.deltaY);
            }
        });

        ipcMain.handle('set-window-visibility', (event, visible) => {
            console.log(`[Main] set-window-visibility called with: ${visible}`);
            this.appSettings.windowVisibility = !!visible;
            this.updateWindowVisibility(visible);
            this.settingsManager.updateSettings({ windowVisibility: visible });

            this.windowManager.broadcast('settings-updated', this.getSettings());
            return { success: true };
        });

        ipcMain.on('overlay-hover', (event, isHover) => {
            try {
                this.windowManager.setInteractive(!!isHover);
            } catch (e) {
                console.error('Failed handling overlay hover:', e);
            }
        });

        ipcMain.on('overlay-focus', (event) => {
            try {
                const mainWin = this.windowManager.getWindow('main');
                if (mainWin && !mainWin.isDestroyed()) {
                    mainWin.show();
                    mainWin.focus();
                }
            } catch (e) {
                console.error('Failed to focus overlay:', e);
            }
        });

        ipcMain.handle('logout', async () => {
            console.log('[Main] Logout requested');

            this.isAuthenticated = false;
            this.currentUser = null;

            await dbService.signOut();

            this.settingsManager.updateSettings({
                userAuthenticated: false,
                userDetails: null
            });

            await this.backendManager.stopTask();

            this.windowManager.hideWindow('chat');

            const chatWin = this.windowManager.getWindow('chat');
            if (chatWin && !chatWin.isDestroyed()) {
                chatWin.reload();
            }

            this.windowManager.hideWindow('settings');
            await this.windowManager.showWindow('entry');

            return { success: true };
        });

        ipcMain.handle('new-conversation', async () => {

            return { success: true };
        });

        ipcMain.handle('lock-app', async () => {
            console.log('[Main] lock-app handler called');
            this.isAuthenticated = false; // ✅ Clear authentication state

            this.windowManager.hideWindow('chat');
            this.windowManager.hideWindow('settings');

            const result = this.securityManager.lockApp();
            console.log('[Main] App locked, showing overlay and entry screen');

            await this.windowManager.showWindow('main');
            await this.windowManager.showWindow('entry');
            return result;
        });

        ipcMain.handle('is-app-locked', () => {
            const isLocked = this.securityManager.isAppLocked();
            console.log('[Main] is-app-locked check:', isLocked);
            return isLocked;
        });

        ipcMain.handle('read-behaviors', () => {
            const storageManager = require('./storage-manager');
            return storageManager.readBehaviors();
        });

        ipcMain.handle('unlock-app', async (event, pin) => {
            console.log('[Main] unlock-app handler called');
            const result = await this.securityManager.unlockApp(pin);
            if (result.success) {
                this.isAuthenticated = true; // ✅ Set authentication state
                console.log('[Main] App unlocked, user authenticated');
            }
            return result;
        });

        ipcMain.handle('set-wakeword-enabled', (event, enabled) => {
            if (enabled) {

                if (this.appSettings.voiceActivation) {
                    this.wakewordManager.enable(true);
                }
            } else {
                this.wakewordManager.enable(false);
            }
            return true;
        });

        ipcMain.handle('set-auto-start', (event, enabled) => {
            console.log('[Main] Setting auto-start to:', enabled);
            app.setLoginItemSettings({
                openAtLogin: enabled,
                path: app.getPath('exe')
            });
            this.appSettings.openAtLogin = enabled;
            this.settingsManager.updateSettings({ openAtLogin: enabled });
            return { success: true };
        });

        ipcMain.handle('execute-task', async (event, task, mode) => {
            console.log('[Main] [IPC] execute-task:', mode, task);

            if (this.appSettings.workflowTriggersEnabled !== false && task.text && !task.skipWorkflowCheck) {
                const workflows = workflowManager.getAllWorkflows();
                const matchedWorkflow = workflows.find(wf => {
                    if (!wf.enabled || wf.trigger.type !== 'keyword') return false;
                    const keyword = wf.trigger.value.toLowerCase();
                    return task.text.toLowerCase().includes(keyword);
                });

                if (matchedWorkflow) {
                    console.log(`[Main] Keyword trigger hit for workflow: ${matchedWorkflow.name}`);
                    this.executeWorkflow(matchedWorkflow);
                    return { success: true, workflowTriggered: true };
                }
            }

            if (this.securityManager.isEnabled() && !this.isAuthenticated) {
                throw new Error('Authentication required');
            }

            const currentUser = this.currentUser || dbService.checkCachedUser();
            if (!currentUser) {
                throw new Error('User profile not loaded. Please sign in.');
            }

            const rateResult = await dbService.checkRateLimit(currentUser.id, mode);
            if (!rateResult.allowed) {
                throw new Error(rateResult.error || 'Rate limit exceeded');
            }

            let apiKey = this.appSettings.geminiApiKey; // Priority 1: User's manually entered key
            
            if (!apiKey) {

                apiKey = await dbService.getGeminiKey(currentUser.plan);
            }
            
            if (!apiKey) {

                const cachedKeys = dbService.getKeys();
                if (cachedKeys && cachedKeys.gemini) {
                    apiKey = cachedKeys.gemini;
                } else {

                    console.log('Using default env API key');
                    apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_FREE_KEY;
                }
            }
            task.api_key = apiKey;

            try {
                const result = await this.backendManager.executeTask(task, mode, this.getSettings());
                await dbService.incrementTaskCount(currentUser.id, mode);

                const updatedUser = await dbService.verifyEntryID(currentUser.id);
                if (updatedUser.success) {
                    this.currentUser = updatedUser.user;

                    dbService.cacheUser(this.currentUser);

                    this.settingsManager.updateSettings({ userDetails: this.currentUser });
                    this.windowManager.broadcast('user-changed', this.currentUser);
                }

                return result;
            } catch (error) {
                console.error('[Main] Execute task error:', error);
                throw error;
            }
        });

        ipcMain.handle('transcribe-audio', async (event, audioData, audioType) => {
            console.log('[Main] [IPC] transcribe-audio requested');
            return { success: false, message: 'Transcription now handled via WebSockets' };
        });

        ipcMain.handle('stop-task', () => {
            return this.backendManager.stopTask();
        });

        ipcMain.handle('stop-action', () => {
            console.log('[Main] Stop action requested');
            return this.backendManager.stopTask();
        });

        ipcMain.handle('confirm-action', (event, confirmed) => {
            console.log('[Main] Action confirmation received:', confirmed);
            if (this.backendManager.actBackend) {
                this.backendManager.actBackend.handleConfirmation(confirmed);
            }
            return { success: true };
        });

        ipcMain.on('log-to-terminal', (event, message) => {
            console.log('[Terminal Log]', message);
        });

        ipcMain.on('register-devtools-window', (event) => {
            console.log('[Main] DevTools window registered for logging');
            if (this.wakewordManager) {
                this.wakewordManager.registerDevToolsWindow(BrowserWindow.fromWebContents(event.sender));
            }
        });

        ipcMain.handle('tts-stop', () => {
            console.log('[Main] [IPC] tts-stop requested');
            this.edgeTTS.stop();
            return { success: true };
        });

        ipcMain.handle('stop-audio', () => {
            console.log('[Main] [IPC] stop-audio requested');
            this.edgeTTS.stop();
            const chatWin = this.windowManager.getWindow('chat');
            if (chatWin && !chatWin.isDestroyed()) {
                chatWin.webContents.send('audio-stopped', { manualStop: true });
            }
            return { success: true };
        });

        ipcMain.handle('tts-get-voices', async () => {
            console.log('[Main] [IPC] tts-get-voices requested');
            const voices = await this.edgeTTS.getAvailableVoices();
            console.log('[Main] [IPC] Available voices:', voices);
            return { success: true, voices };
        });

        ipcMain.handle('tts-set-voice', (event, voice) => {
            console.log('[Main] [IPC] tts-set-voice requested:', voice);
            this.edgeTTS.setVoice(voice);
            return { success: true };
        });

        ipcMain.handle('tts-set-rate', (event, rate) => {
            console.log('[Main] [IPC] tts-set-rate requested:', rate);
            this.edgeTTS.setRate(rate);
            return { success: true };
        });

        ipcMain.handle('tts-set-volume', (event, volume) => {
            console.log('[Main] [IPC] tts-set-volume requested:', volume);
            this.edgeTTS.setVolume(volume);
            return { success: true };
        });

        ipcMain.handle('tts-test-voice', async (event, voice, rate, volume) => {
            console.log('[Main] [IPC] tts-test-voice requested:', { voice, rate, volume });
            this.edgeTTS.setVoice(voice);
            this.edgeTTS.setRate(rate);
            this.edgeTTS.setVolume(volume);

            const sampleText = "Hello! This is a sample of how I will sound with your current settings.";
            this.edgeTTS.speak(sampleText);
            return { success: true };
        });

        ipcMain.handle('should-speak-greeting', () => {
            const shouldSpeak = this.appSettings.greetingTTS || false;
            console.log('[Main] [IPC] should-speak-greeting requested. Setting:', shouldSpeak);
            return { shouldSpeak };
        });

        ipcMain.handle('speak-greeting', (event, text) => {
            console.log('[Main] [IPC] speak-greeting requested:', text);
            console.log('[Main] [IPC] greetingTTS setting:', this.appSettings.greetingTTS);

            if (this.appSettings.greetingTTS && text) {
                console.log('[Main] [IPC] ✓ All conditions met - Speaking greeting via EdgeTTS');
                if (!this.edgeTTS.isEnabled()) {
                    this.edgeTTS.enable(true);
                }
                this.edgeTTS.speak(text);
                return { success: true, message: 'Greeting spoken' };
            } else {
                return { success: false, message: 'Greeting TTS disabled or no text provided' };
            }
        });

        ipcMain.handle('get-settings', () => {
            return this.settingsManager.getSettings();
        });

        ipcMain.handle('save-settings', async (event, settings) => {
            return await this.saveSettings(settings);
        });

        ipcMain.handle('update-hotkeys', (event, newHotkeys) => {
            console.log('[Main] [IPC] update-hotkeys:', newHotkeys);

            if (!newHotkeys || !newHotkeys.toggleChat || !newHotkeys.stopAction) {
                return { success: false, message: 'Invalid hotkey configuration' };
            }

            const success = this.settingsManager.updateSettings({ hotkeys: newHotkeys });

            if (success) {

                this.hotkeyManager.updateHotkeys(newHotkeys);
                this.windowManager.broadcast('settings-updated', this.getSettings());
                return { success: true };
            }

            return { success: false, message: 'Failed to save hotkey settings' };
        });

        ipcMain.handle('update-floating-button', (event, visible) => {

            this.appSettings.floatingButtonVisible = visible;

            try {
                this.settingsManager.updateSettings({ floatingButtonVisible: visible });
            } catch (e) {
                console.error('[Main] Failed to update settings manager for floating button:', e);
            }

            try {
                this.windowManager.broadcast('settings-updated', this.getSettings());
            } catch (e) {
                console.error('[Main] Failed to broadcast settings-updated after floating button change:', e);
            }

            try {
                global.appSettings = this.appSettings;
            } catch (e) {
                console.error('[Main] Failed to update global.appSettings:', e);
            }

            console.log('[Main] Floating button updated:', visible);

            const mainWin = this.windowManager.getWindow('main');
            if (mainWin && !mainWin.isDestroyed()) {
                mainWin.webContents.send('floating-button-toggle', visible);
            }

            return { success: true, floatingButtonVisible: visible };
        });

        ipcMain.handle('open-website', () => {
            shell.openExternal('https://controlrebuild-website.vercel.app');
            return { success: true };
        });

        ipcMain.handle('quit-app', () => {

            this.windowManager.closeAllWindows();

            this.backendManager.stopBackend();

            this.quitApp();
            return { success: true };
        });

        ipcMain.handle('restart-app', () => {
            app.relaunch();
            app.exit();
            return { success: true };
        });

        ipcMain.handle('delete-all-data', async () => {
            console.log('[Main] Delete all data requested');
            try {

                this.settingsManager.resetSettings();

                dbService.clearCachedUser();
                this.isAuthenticated = false;
                this.currentUser = null;

                workflowManager.deleteAllWorkflows();

                const screenshotDir = path.join(os.tmpdir(), "control_screenshots");
                if (fs.existsSync(screenshotDir)) {
                    const files = fs.readdirSync(screenshotDir);
                    for (const file of files) {
                        fs.unlinkSync(path.join(screenshotDir, file));
                    }
                }

                return { success: true };
            } catch (e) {
                console.error('Failed to delete all data:', e);
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('export-data', async () => {
            console.log('[Main] Export data requested');
            try {
                const settings = this.settingsManager.getSettings();
                const workflows = workflowManager.getAllWorkflows();
                const data = {
                    version: '1.0.0',
                    exportDate: new Date().toISOString(),
                    settings,
                    workflows
                };
                return { success: true, data };
            } catch (e) {
                console.error('Failed to export data:', e);
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('browser-navigate', async (event, url) => {
            console.log(`[Main] Browser navigate: ${url}`);
            try {
                return await electronBrowserManager.open(url);
            } catch (e) {
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('browser-execute-js', async (event, script) => {
            console.log(`[Main] Browser execute JS`);
            try {
                const result = await electronBrowserManager.executeJs(script);
                return { success: true, result };
            } catch (e) {
                return { success: false, message: e.message };
            }
        });

        ipcMain.handle('browser-get-status', async () => {
            return await electronBrowserManager.getStatus();
        });

        ipcMain.handle('browser-close', async () => {
            await electronBrowserManager.close();
            return { success: true };
        });

        ipcMain.handle('set-modal-active', (event, active) => {
            const win = electron.BrowserWindow.fromWebContents(event.sender);
            if (win) win.isModalActive = active;
            return { success: true };
        });

        ipcMain.handle('show-confirm-modal', async (event, options) => {
            const { dialog } = require('electron');
            const win = electron.BrowserWindow.fromWebContents(event.sender);
            if (win) win.isModalActive = true;
            try {
                const result = await dialog.showMessageBox(win, {
                    type: options.type || 'question',
                    buttons: [options.confirmText || 'Yes', options.cancelText || 'No'],
                    defaultId: 0,
                    cancelId: 1,
                    title: options.title || 'Confirm',
                    message: options.message || 'Are you sure?',
                    detail: options.detail || ''
                });
                return result.response === 0;
            } finally {
                if (win && !win.isDestroyed()) win.isModalActive = false;
            }
        });

        ipcMain.handle('show-prompt-modal', async (event, message, defaultValue, options) => {

            console.warn('[Main] show-prompt-modal not fully implemented, returning default');
            return defaultValue;
        });
    }

    getSettings() {
        const settings = this.settingsManager.getSettings();

        settings.pinEnabled = this.securityManager.pinEnabled;

        settings.layout = this.appSettings.layout || 'classic';
        settings.autoSendAfterWakeWord = this.appSettings.autoSendAfterWakeWord || false;
        settings.lastMode = this.appSettings.lastMode || 'act';
        settings.windowVisibility = this.appSettings.windowVisibility !== undefined ? this.appSettings.windowVisibility : true;
        settings.wakeWordToggleChat = this.appSettings.wakeWordToggleChat || false;
        settings.edgeGlowEnabled = this.appSettings.edgeGlowEnabled !== false;
        settings.borderStreakEnabled = this.appSettings.borderStreakEnabled !== false;
        settings.workflowTriggersEnabled = this.appSettings.workflowTriggersEnabled !== false;
        settings.theme = this.appSettings.theme || 'light';
        settings.chatVisible = this.windowManager.chatVisible;
        settings.modelProvider = this.appSettings.modelProvider || 'gemini';
        settings.openrouterModel = this.appSettings.openrouterModel || 'anthropic/claude-3.5-sonnet';
        settings.openrouterCustomModel = this.appSettings.openrouterCustomModel || '';
        settings.openrouterApiKey = this.appSettings.openrouterApiKey || '';
        settings.ollamaUrl = this.appSettings.ollamaUrl || 'http://localhost:11434';
        settings.ollamaModel = this.appSettings.ollamaModel || 'llama3';
        settings.universalApiKey = this.appSettings.universalApiKey || '';
        settings.universalModel = this.appSettings.universalModel || '';
        settings.universalBaseUrl = this.appSettings.universalBaseUrl || '';
        settings.cloudRegion = this.appSettings.cloudRegion || '';
        settings.cloudCredentials = this.appSettings.cloudCredentials || '';
        settings.cloudModel = this.appSettings.cloudModel || '';
        settings.openaiApiKey = this.appSettings.openaiApiKey || '';
        settings.openaiModel = this.appSettings.openaiModel || 'gpt-4o';
        settings.anthropicApiKey = this.appSettings.anthropicApiKey || '';
        settings.anthropicModel = this.appSettings.anthropicModel || 'claude-3-5-sonnet-20240620';
        settings.xaiApiKey = this.appSettings.xaiApiKey || '';
        settings.xaiModel = this.appSettings.xaiModel || 'grok-beta';
        settings.deepseekApiKey = this.appSettings.deepseekApiKey || '';
        settings.deepseekModel = this.appSettings.deepseekModel || 'deepseek-chat';
        settings.moonshotApiKey = this.appSettings.moonshotApiKey || '';
        settings.moonshotModel = this.appSettings.moonshotModel || 'moonshot-v1-8k';
        settings.zaiApiKey = this.appSettings.zaiApiKey || '';
        settings.zaiModel = this.appSettings.zaiModel || 'zai-model';
        settings.litellmApiKey = this.appSettings.litellmApiKey || '';
        settings.litellmModel = this.appSettings.litellmModel || 'gpt-4o';
        settings.minimaxApiKey = this.appSettings.minimaxApiKey || '';
        settings.minimaxModel = this.appSettings.minimaxModel || 'abab6.5-chat';
        settings.lmstudioApiKey = this.appSettings.lmstudioApiKey || '';
        settings.lmstudioModel = this.appSettings.lmstudioModel || 'model-identifier';
        settings.ttsVoice = this.appSettings.ttsVoice || 'en-US-AriaNeural';
        settings.ttsRate = this.appSettings.ttsRate !== undefined ? this.appSettings.ttsRate : 1.0;
        settings.ttsVolume = this.appSettings.ttsVolume !== undefined ? this.appSettings.ttsVolume : 1.0;

        const cachedKeys = dbService.getKeys();
        settings.geminiApiKey = this.appSettings.geminiApiKey || (cachedKeys ? cachedKeys.gemini : '');
        settings.geminiModel = this.appSettings.geminiModel || (cachedKeys ? cachedKeys.gemini_model : (process.env.GEMINI_MODEL || "gemini-2.5-flash"));
        
        return settings;
    }

    async executeWorkflow(workflow) {
        this.workflowQueue.push(workflow);
        this.processWorkflowQueue();
    }

    async processWorkflowQueue() {
        if (this.isProcessingQueue || this.workflowQueue.length === 0) return;
        this.isProcessingQueue = true;

        while (this.workflowQueue.length > 0) {
            const workflow = this.workflowQueue.shift();
            await this.runWorkflow(workflow);
        }

        this.isProcessingQueue = false;
    }

    async runWorkflow(workflow) {
        console.log(`[Main] Running workflow: ${workflow.name}`);

        let taskDescription = `Perform the workflow: "${workflow.name}".\nSteps:\n`;
        workflow.steps.forEach((step, index) => {
            let detail = "";
            if (step.type === 'app') {
                if (process.platform === 'win32' && step.value.includes('!')) {
                    detail = `Open the application with ID: "${step.value}". You can use the terminal command "explorer shell:AppsFolder\\${step.value}" to launch it if it's not already open.`;
                } else {
                    detail = `Open application: "${step.value}"`;
                }
            }
            else if (step.type === 'file' || step.type === 'document') detail = `Open file: "${step.value}"`;
            else if (step.type === 'web_search') detail = `Search the web for: "${step.value}" and retrieve relevant information.`;
            else if (step.type === 'browser_search') detail = `Search for "${step.value}" using the agentic browser. Open the browser to a search engine, perform the search, and extract relevant data using JS injection if needed.`;
            else if (step.type === 'nl_task') detail = step.value;

            taskDescription += `${index + 1}. ${detail}\n`;
        });

        const task = {
            text: taskDescription,
            attachments: []
        };

        const mode = 'act';

        try {

            const currentUser = this.currentUser || dbService.checkCachedUser();
            let apiKey = await dbService.getGeminiKey(currentUser.plan);
            if (!apiKey) {
                const cachedKeys = dbService.getKeys();
                apiKey = (cachedKeys && cachedKeys.gemini) ? cachedKeys.gemini : (process.env.GEMINI_API_KEY || process.env.GEMINI_FREE_KEY);
            }
            task.api_key = apiKey;

            const chatWin = this.windowManager.getWindow('chat');
            if (chatWin) {
                chatWin.webContents.send('workflow-started', { name: workflow.name });
            }

            await this.backendManager.executeTask(task, mode, this.getSettings());
            console.log(`[Main] Workflow ${workflow.name} completed`);
        } catch (error) {
            console.error(`[Main] Workflow ${workflow.name} failed:`, error);
        }
    }

    startWorkflowScheduler() {
        console.log('[Main] Starting workflow scheduler...');
        this.lastCheckedMinute = null;

        setInterval(() => {
            if (this.appSettings.workflowTriggersEnabled === false) return;

            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            if (this.lastCheckedMinute === currentTime) return;
            this.lastCheckedMinute = currentTime;

            const currentDayFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
            const currentDayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

            console.log(`[Scheduler] Checking workflows for ${currentDayFull} ${currentTime}`);

            const workflows = workflowManager.getAllWorkflows();
            workflows.forEach(wf => {
                if (wf.enabled && wf.trigger && wf.trigger.type === 'time' && wf.trigger.value === currentTime) {

                    const days = wf.trigger.days || [];
                    if (days.length === 0 || days.includes(currentDayFull) || days.includes(currentDayShort)) {
                        console.log(`[Scheduler] Triggering workflow: ${wf.name}`);
                        this.executeWorkflow(wf);
                    }
                }
            });
        }, 10000); // Check every 10 seconds
    }

    updateWindowVisibility(visible) {
        console.log(`[Main] Updating window visibility in real-time: ${visible}`);
        this.appSettings.windowVisibility = visible;
        global.appSettings = this.appSettings;

        if (this.windowManager) {
            this.windowManager.updateAllWindowVisibility(visible);
        }
    }

    async saveSettings(settings) {
        console.log('[Main] saveSettings called with updates:', settings);
        try {
            const oldSettings = this.settingsManager.getSettings();

            if (settings.securityPin !== undefined) {
                await this.securityManager.setPin(settings.securityPin);
            }
            if (settings.pinEnabled !== undefined) {
                await this.securityManager.enablePin(settings.pinEnabled);

                if (!settings.pinEnabled) {
                    this.isAuthenticated = false;
                }
            }
            if (settings.voiceActivation !== undefined) {
                console.log('[Main] saveSettings: request to set voiceActivation=', !!settings.voiceActivation, 'PORCUPINE_KEY_PRESENT=', !!process.env.PORCUPINE_ACCESS_KEY);
                this.appSettings.voiceActivation = !!settings.voiceActivation;
                await this.wakewordManager.enable(this.appSettings.voiceActivation);
            }
            if (settings.voiceResponse !== undefined) {
                this.appSettings.voiceResponse = !!settings.voiceResponse;
                this.edgeTTS.enable(this.appSettings.voiceResponse);
            }
            if (settings.greetingTTS !== undefined) {
                this.appSettings.greetingTTS = !!settings.greetingTTS;
            }
            if (settings.autoSendAfterWakeWord !== undefined) {
                this.appSettings.autoSendAfterWakeWord = !!settings.autoSendAfterWakeWord;
            }
            if (settings.lastMode !== undefined) {
                this.appSettings.lastMode = settings.lastMode;
                if (this.appSettings.userDetails) {
                    this.appSettings.userDetails.lastMode = settings.lastMode;
                }
            }
            if (settings.windowVisibility !== undefined) {
                this.appSettings.windowVisibility = !!settings.windowVisibility;
                this.updateWindowVisibility(this.appSettings.windowVisibility);
            }
            if (settings.wakeWordToggleChat !== undefined) {
                this.appSettings.wakeWordToggleChat = !!settings.wakeWordToggleChat;
            }
            if (settings.edgeGlowEnabled !== undefined) {
                this.appSettings.edgeGlowEnabled = !!settings.edgeGlowEnabled;
            }
            if (settings.borderStreakEnabled !== undefined) {
                this.appSettings.borderStreakEnabled = !!settings.borderStreakEnabled;
            }
            if (settings.workflowTriggersEnabled !== undefined) {
                this.appSettings.workflowTriggersEnabled = !!settings.workflowTriggersEnabled;
            }
            if (settings.theme !== undefined) {
                this.appSettings.theme = settings.theme;
            }
            if (settings.layout !== undefined) {
                this.appSettings.layout = settings.layout;
            }
            if (settings.modelProvider !== undefined) {
                this.appSettings.modelProvider = settings.modelProvider;
            }
            if (settings.openrouterModel !== undefined) {
                this.appSettings.openrouterModel = settings.openrouterModel;
            }
            if (settings.openrouterCustomModel !== undefined) {
                this.appSettings.openrouterCustomModel = settings.openrouterCustomModel;
            }
            if (settings.openrouterApiKey !== undefined) {
                this.appSettings.openrouterApiKey = settings.openrouterApiKey;
            }
            if (settings.ollamaUrl !== undefined) {
                this.appSettings.ollamaUrl = settings.ollamaUrl;
            }
            if (settings.ollamaModel !== undefined) {
                this.appSettings.ollamaModel = settings.ollamaModel;
            }
            if (settings.universalApiKey !== undefined) this.appSettings.universalApiKey = settings.universalApiKey;
            if (settings.universalModel !== undefined) this.appSettings.universalModel = settings.universalModel;
            if (settings.universalBaseUrl !== undefined) this.appSettings.universalBaseUrl = settings.universalBaseUrl;
            if (settings.cloudRegion !== undefined) this.appSettings.cloudRegion = settings.cloudRegion;
            if (settings.cloudCredentials !== undefined) this.appSettings.cloudCredentials = settings.cloudCredentials;
            if (settings.cloudModel !== undefined) this.appSettings.cloudModel = settings.cloudModel;
            if (settings.openaiApiKey !== undefined) this.appSettings.openaiApiKey = settings.openaiApiKey;
            if (settings.openaiModel !== undefined) this.appSettings.openaiModel = settings.openaiModel;
            if (settings.anthropicApiKey !== undefined) this.appSettings.anthropicApiKey = settings.anthropicApiKey;
            if (settings.anthropicModel !== undefined) this.appSettings.anthropicModel = settings.anthropicModel;
            if (settings.xaiApiKey !== undefined) this.appSettings.xaiApiKey = settings.xaiApiKey;
            if (settings.xaiModel !== undefined) this.appSettings.xaiModel = settings.xaiModel;
            if (settings.deepseekApiKey !== undefined) this.appSettings.deepseekApiKey = settings.deepseekApiKey;
            if (settings.deepseekModel !== undefined) this.appSettings.deepseekModel = settings.deepseekModel;
            if (settings.moonshotApiKey !== undefined) this.appSettings.moonshotApiKey = settings.moonshotApiKey;
            if (settings.moonshotModel !== undefined) this.appSettings.moonshotModel = settings.moonshotModel;
            if (settings.zaiApiKey !== undefined) this.appSettings.zaiApiKey = settings.zaiApiKey;
            if (settings.zaiModel !== undefined) this.appSettings.zaiModel = settings.zaiModel;
            if (settings.litellmApiKey !== undefined) this.appSettings.litellmApiKey = settings.litellmApiKey;
            if (settings.litellmModel !== undefined) this.appSettings.litellmModel = settings.litellmModel;
            if (settings.minimaxApiKey !== undefined) this.appSettings.minimaxApiKey = settings.minimaxApiKey;
            if (settings.minimaxModel !== undefined) this.appSettings.minimaxModel = settings.minimaxModel;
            if (settings.lmstudioApiKey !== undefined) this.appSettings.lmstudioApiKey = settings.lmstudioApiKey;
            if (settings.lmstudioModel !== undefined) this.appSettings.lmstudioModel = settings.lmstudioModel;

            if (settings.ttsVoice !== undefined) {
                this.appSettings.ttsVoice = settings.ttsVoice;
                this.edgeTTS.setVoice(settings.ttsVoice);
            }
            if (settings.ttsRate !== undefined) {
                this.appSettings.ttsRate = settings.ttsRate;
                this.edgeTTS.setRate(settings.ttsRate);
            }
            if (settings.ttsVolume !== undefined) {
                this.appSettings.ttsVolume = settings.ttsVolume;
                this.edgeTTS.setVolume(settings.ttsVolume);
            }

            if (settings.hotkeys) {
                const oldHotkeys = JSON.stringify(oldSettings.hotkeys);
                const newHotkeys = JSON.stringify(settings.hotkeys);

                if (oldHotkeys !== newHotkeys) {
                    console.log('[Main] Hotkeys changed, updating manager...');
                    this.hotkeyManager.updateHotkeys(settings.hotkeys);
                }
            }

            this.settingsManager.updateSettings({
                ...settings,

                voiceActivation: this.appSettings.voiceActivation,
                voiceResponse: this.appSettings.voiceResponse,
                greetingTTS: this.appSettings.greetingTTS,
                autoSendAfterWakeWord: this.appSettings.autoSendAfterWakeWord,
                lastMode: this.appSettings.lastMode,
                windowVisibility: this.appSettings.windowVisibility,
                wakeWordToggleChat: this.appSettings.wakeWordToggleChat,
                edgeGlowEnabled: this.appSettings.edgeGlowEnabled,
                borderStreakEnabled: this.appSettings.borderStreakEnabled,
                workflowTriggersEnabled: this.appSettings.workflowTriggersEnabled,
                theme: this.appSettings.theme,
                layout: this.appSettings.layout,
                modelProvider: this.appSettings.modelProvider,
                openrouterModel: this.appSettings.openrouterModel,
                openrouterCustomModel: this.appSettings.openrouterCustomModel,
                openrouterApiKey: this.appSettings.openrouterApiKey,
                ollamaUrl: this.appSettings.ollamaUrl,
                ollamaModel: this.appSettings.ollamaModel,
                universalApiKey: this.appSettings.universalApiKey,
                universalModel: this.appSettings.universalModel,
                universalBaseUrl: this.appSettings.universalBaseUrl,
                cloudRegion: this.appSettings.cloudRegion,
                cloudCredentials: this.appSettings.cloudCredentials,
                cloudModel: this.appSettings.cloudModel,
                openaiApiKey: this.appSettings.openaiApiKey,
                openaiModel: this.appSettings.openaiModel,
                anthropicApiKey: this.appSettings.anthropicApiKey,
                anthropicModel: this.appSettings.anthropicModel,
                xaiApiKey: this.appSettings.xaiApiKey,
                xaiModel: this.appSettings.xaiModel,
                deepseekApiKey: this.appSettings.deepseekApiKey,
                deepseekModel: this.appSettings.deepseekModel,
                moonshotApiKey: this.appSettings.moonshotApiKey,
                moonshotModel: this.appSettings.moonshotModel,
                zaiApiKey: this.appSettings.zaiApiKey,
                zaiModel: this.appSettings.zaiModel,
                litellmApiKey: this.appSettings.litellmApiKey,
                litellmModel: this.appSettings.litellmModel,
                minimaxApiKey: this.appSettings.minimaxApiKey,
                minimaxModel: this.appSettings.minimaxModel,
                lmstudioApiKey: this.appSettings.lmstudioApiKey,
                lmstudioModel: this.appSettings.lmstudioModel,
                ttsVoice: this.appSettings.ttsVoice,
                ttsRate: this.appSettings.ttsRate,
                ttsVolume: this.appSettings.ttsVolume
            });

            this.appSettings = this.settingsManager.getSettings();

            this.windowManager.broadcast('settings-updated', this.getSettings());

            return { success: true };
        } catch (error) {
            console.error('Failed to save settings:', error);
            return { success: false, error: error.message };
        }
    }

    onWindowAllClosed() {

        if (process.platform !== 'darwin' && this.isQuitting) {
            app.quit();
        }
    }

    onActivate() {
        if (!this.isReady) {
            this.onAppReady();
        }
    }

    onWillQuit() {
        this.hotkeyManager.unregisterAll();
        if (this.backendManager) this.backendManager.stopBackend();
        if (this.voskServerManager) this.voskServerManager.stop();
        this.windowManager.closeAllWindows();
    }

    setupTray() {
        try {

            const iconPath = path.join(__dirname, '../../assets/icons/icon-removebg-preview.png');

            this.tray = new Tray(iconPath);
            this.tray.setToolTip('Control - AI Assistant');

            const contextMenu = Menu.buildFromTemplate([
                {
                    label: 'Show/Hide Chat',
                    click: () => {
                        this.windowManager.toggleChat();
                    }
                },
                {
                    label: 'Settings',
                    click: async () => {
                        await this.windowManager.showWindow('settings');
                    }
                },
                {
                    label: 'Sign In / Account',
                    click: async () => {
                        await this.windowManager.showWindow('entry');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    click: () => {
                        this.quitApp();
                    }
                }
            ]);

            this.tray.setContextMenu(contextMenu);

            this.tray.on('double-click', () => {
                this.windowManager.toggleChat();
            });

            console.log('System tray initialized');
        } catch (error) {
            console.error('Failed to setup system tray:', error);
        }
    }

    quitApp() {
        this.isQuitting = true;
        if (this.tray) {
            this.tray.destroy();
        }
        app.quit();
    }

    cleanMarkdownForTTS(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*([^*\n]+)\*/g, '$1') // Italic
            .replace(/__([^_]+)__/g, '$1') // Bold/Italic
            .replace(/`([^`]+)`/g, '$1') // Inline code
            .replace(/```[\s\S]*?```/g, 'Code block skipped') // Code blocks (skip content or say "code")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links: [text](url) -> text
            .replace(/^#+\s+/gm, '') // Headers
            .replace(/^\s*[-*+]\s+/gm, '') // List bullets
            .replace(/[*_~`]/g, '') // Remaining markdown symbols
            .trim();
    }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('[Main] Another instance is already running, quitting...');
    console.log('[Main] Application already running - exiting this instance');
    app.quit();
} else {

    const agent = new ComputerUseAgent();

    app.on('second-instance', async (event, commandLine, workingDirectory) => {
        console.log('[Main] Second instance detected, showing entry window');
        console.log('[Main] Attempting to open entry page for second instance');

        if (agent && agent.windowManager) {

            console.log('[Main] Second instance - current authentication state:', agent.isAuthenticated);

            const entryWin = agent.windowManager.getWindow('entry');
            if (entryWin && !entryWin.isDestroyed()) {
                console.log('[Main] Entry window exists, showing and focusing it');
                if (entryWin.isMinimized()) entryWin.restore();
                entryWin.show();
                entryWin.focus();
            } else {

                console.log('[Main] Entry window does not exist, creating it');
                await agent.windowManager.showWindow('entry');
            }
        }
    });

    }
