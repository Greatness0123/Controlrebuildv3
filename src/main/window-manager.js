const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

app.disableHardwareAcceleration()

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.creatingWindows = new Set();
        this.mainWindow = null;
        this.chatVisible = false;
        this.isInteractive = false; // overlay click-through by default; enable on hover when needed
        this.isQuitting = false;
    }

    broadcast(channel, data) {
        this.windows.forEach(window => {
            if (window && !window.isDestroyed()) {
                window.webContents.send(channel, data);
            }
        });
    }

    async initializeWindows() {

        console.log('[WindowManager] Initializing core windows...');
        await this.createMainWindow();
        await this.createEntryWindow();

        this.setupWindowManagement();
    }

    applyCurrentVisibility(window) {
        if (!window || window.isDestroyed()) return;
        const visible = global.appSettings?.windowVisibility !== false;
        try {
            window.setContentProtection(!visible);

            window.setVisibleOnAllWorkspaces(visible, { visibleOnFullScreen: true });
        } catch (e) {
            console.warn('[WindowManager] Could not apply setVisibleOnAllWorkspaces:', e.message);
        }
    }

    async createMainWindow() {
        const { width, height, x, y } = screen.getPrimaryDisplay().bounds;

        this.mainWindow = new BrowserWindow({
            width: width,
            height: height,
            x: x,
            y: y,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            fullscreenable: false,
            visibleOnAllWorkspaces: true,
            hasShadow: false,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../preload/main-preload.js'),
                webSecurity: !isDev
            }
        });
        this.mainWindow.setAlwaysOnTop(true, 'floating')

        this.mainWindow.setIgnoreMouseEvents(!this.isInteractive, { forward: !this.isInteractive });

        await this.mainWindow.loadFile(
            path.join(__dirname, '../renderer/main-overlay.html')
        );

        this.windows.set('main', this.mainWindow);
        this.applyCurrentVisibility(this.mainWindow);

    }

    async createChatWindow() {
        console.log('[WindowManager] Creating chat window...');
        const iconPath = path.join(__dirname, '../../assets/icons/icon.ico');
        const chatWindow = new BrowserWindow({
            width: 360,
            height: 480,
            x: screen.getPrimaryDisplay().workAreaSize.width - 380,
            y: screen.getPrimaryDisplay().workAreaSize.height - 520,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            icon: iconPath,
            resizable: true,
            minWidth: 320,
            minHeight: 480,
            maxWidth: 600,
            maxHeight: 520,
            movable: true,
            minimizable: false,
            maximizable: false,
            closable: false,
            fullscreenable: false,
            roundedCorners: true,
            show: false,
            hasShadow: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../preload/chat-preload.js'),
                webSecurity: !isDev
            }
        });

        chatWindow.setAlwaysOnTop(true, 'screen-saver')

        try {
            await chatWindow.loadFile(
                path.join(__dirname, '../renderer/chat-window.html')
            );
            console.log('[WindowManager] Chat window loaded successfully');
        } catch (err) {
            console.error('[WindowManager] Failed to load chat window:', err);
            throw err;
        }

        this.windows.set('chat', chatWindow);
        this.applyCurrentVisibility(chatWindow);

        this.setupDraggableWindow(chatWindow);

        chatWindow.webContents.on('render-process-gone', (event, details) => {
            console.error('[WindowManager] Chat window renderer process gone:', details.reason, details.exitCode);
        });

        chatWindow.on('unresponsive', () => {
            console.error('[WindowManager] Chat window became unresponsive');
        });

        chatWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            console.log(`[Chat Renderer ${level}] ${message} (${sourceId}:${line})`);
        });

        console.log('[WindowManager] Chat window created and registered');
    }

    async createSettingsWindow() {
        console.log('[WindowManager] Creating settings window...');
        const settingsWindow = new BrowserWindow({
            width: 800,
            height: 600,
            frame: false,
            transparent: true,
            backgroundColor: '#00000000',
            roundedCorners: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: true,
            movable: true,
            minimizable: false,
            maximizable: false,
            closable: false,
            fullscreenable: false,
            show: false,
            hasShadow: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../preload/settings-preload.js'),
                webSecurity: !isDev
            }
        });
        settingsWindow.setAlwaysOnTop(true, 'screen-saver')
        try {
            await settingsWindow.loadFile(
                path.join(__dirname, '../renderer/settings-modal.html')
            );
            console.log('[WindowManager] Settings window loaded successfully');
        } catch (err) {
            console.error('[WindowManager] Failed to load settings window:', err);
            throw err;
        }

        this.windows.set('settings', settingsWindow);
        this.applyCurrentVisibility(settingsWindow);

        this.setupDraggableWindow(settingsWindow);

        settingsWindow.on('blur', () => {
            setTimeout(() => {
                try {
                    if (!settingsWindow.isDestroyed() && !settingsWindow.isFocused()) {

                        if (settingsWindow.isModalActive) {
                            console.log('[WindowManager] Settings window blurred but modal is active, not hiding');
                            return;
                        }

                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        const isOtherManagedWindowFocused = Array.from(this.windows.values()).some(w => w === focusedWindow);

                        if (!isOtherManagedWindowFocused) {
                            settingsWindow.hide();
                        }
                    }
                } catch (e) { }
            }, 300);
        });
        console.log('[WindowManager] Settings window created and registered');
    }

    async createWorkflowWindow() {
        console.log('[WindowManager] Creating workflow window...');
        const workflowWindow = new BrowserWindow({
            width: 900,
            height: 600,
            frame: false,
            transparent: true,
            backgroundColor: '#00000000',
            roundedCorners: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: true,
            movable: true,
            minimizable: true,
            maximizable: true,
            closable: false,
            fullscreenable: false,
            show: false,
            hasShadow: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../preload/workflow-preload.js'),
                webSecurity: !isDev
            }
        });

        workflowWindow.setAlwaysOnTop(true, 'screen-saver')

        try {
            await workflowWindow.loadFile(
                path.join(__dirname, '../renderer/workflow-window.html')
            );
            console.log('[WindowManager] Workflow window loaded successfully');
        } catch (err) {
            console.error('[WindowManager] Failed to load workflow window:', err);
            throw err;
        }

        this.windows.set('workflow', workflowWindow);
        this.applyCurrentVisibility(workflowWindow);
        this.setupDraggableWindow(workflowWindow);
    }

    async createLiteWindow() {
        console.log('[WindowManager] Creating lite window...');
        const liteWindow = new BrowserWindow({
            width: 400,
            height: 600,
            x: screen.getPrimaryDisplay().workAreaSize.width - 420,
            y: screen.getPrimaryDisplay().workAreaSize.height - 620,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: true,
            movable: true,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../preload/lite-preload.js'),
                webSecurity: !isDev
            }
        });
        liteWindow.setAlwaysOnTop(true, 'screen-saver');
        await liteWindow.loadFile(path.join(__dirname, '../renderer/lite-window.html'));
        this.windows.set('lite', liteWindow);
        this.applyCurrentVisibility(liteWindow);
        this.setupDraggableWindow(liteWindow);
    }

    async createEntryWindow() {
        console.log('[WindowManager] Creating entry window...');
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        const entryWindow = new BrowserWindow({
            width: 800,
            height: 600,
            x: (width - 800) / 2,
            y: (height - 600) / 2,
            frame: false,
            transparent: false,
            alwaysOnTop: true,
            skipTaskbar: false,
            resizable: true,
            movable: true,
            minimizable: true,
            maximizable: true,
            closable: true,
            fullscreenable: false,
            show: false,
            hasShadow: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../preload/entry-preload.js'),
                webSecurity: !isDev
            }
        });

        try {
            await entryWindow.loadFile(
                path.join(__dirname, '../renderer/entry-window.html')
            );
            console.log('[WindowManager] Entry window loaded successfully');
        } catch (err) {
            console.error('[WindowManager] Failed to load entry window:', err);
            throw err;
        }

        this.windows.set('entry', entryWindow);
        this.applyCurrentVisibility(entryWindow);

        this.setupDraggableWindow(entryWindow);
    }

    setupDraggableWindow(window) {

    }

    setupWindowManagement() {

        screen.on('display-metrics-changed', () => {
            this.ensureWindowsOnScreen();
        });
    }

    ensureWindowsOnScreen() {
        const displays = screen.getAllDisplays();
        const primaryDisplay = screen.getPrimaryDisplay();

        this.windows.forEach((window, type) => {
            if (window && !window.isDestroyed() && window.isVisible()) {
                const bounds = window.getBounds();
                let onScreen = false;

                for (const display of displays) {
                    if (
                        bounds.x < display.bounds.x + display.bounds.width &&
                        bounds.x + bounds.width > display.bounds.x &&
                        bounds.y < display.bounds.y + display.bounds.height &&
                        bounds.y + bounds.height > display.bounds.y
                    ) {
                        onScreen = true;
                        break;
                    }
                }

                if (!onScreen) {

                    window.setPosition(
                        primaryDisplay.workArea.x + 100,
                        primaryDisplay.workArea.y + 100
                    );
                }
            }
        });
    }

    async showWindow(windowType) {
        let browserWindow = this.windows.get(windowType);
        console.log(`[WindowManager] showWindow('${windowType}'):`, { exists: !!browserWindow, destroyed: browserWindow?.isDestroyed?.() });

        if (!browserWindow || browserWindow.isDestroyed()) {
            console.log(`[WindowManager] Window ${windowType} not found or destroyed, recreating...`);
            if (windowType === 'entry') await this.createEntryWindow();
            else if (windowType === 'chat') await this.createChatWindow();
            else if (windowType === 'lite') await this.createLiteWindow();
            else if (windowType === 'settings') await this.createSettingsWindow();
            else if (windowType === 'workflow') await this.createWorkflowWindow();
            else if (windowType === 'main') await this.createMainWindow();

            browserWindow = this.windows.get(windowType);
        }

        if (browserWindow && !browserWindow.isDestroyed()) {
            if (windowType === 'chat') {
                this.chatVisible = true;
                console.log('[WindowManager] showWindow(chat): hiding floating button if enabled');
                this.hideFloatingButtonIfEnabled();
            }
            if (windowType === 'settings') {
                this.setInteractive(false);
                console.log('[WindowManager] showWindow(settings): hiding floating button if enabled');
                this.hideFloatingButtonIfEnabled();
            }

            console.log(`[WindowManager] showWindow: Showing and focusing ${windowType}. Current state: chatVisible=${this.chatVisible}`);

            browserWindow.show();
            browserWindow.focus();

            return true;
        }
        return false;
    }

    hideWindow(windowType) {
        const browserWindow = this.windows.get(windowType);
        if (browserWindow && !browserWindow.isDestroyed()) {
            if (!browserWindow.isVisible()) return true;

            if (windowType === 'chat') {
                this.chatVisible = false;
            }

            this.setInteractive(false);

            this.showFloatingButtonIfEnabled();

            browserWindow.hide();
            console.log(`[WindowManager] hideWindow: Hiding ${windowType}. Current state: chatVisible=${this.chatVisible}`);
            return true;
        }
        return false;
    }

    async toggleChat() {
        const layout = global.appSettings?.layout || 'classic';
        const target = layout === 'lite' ? 'lite' : 'chat';
        const other = layout === 'lite' ? 'chat' : 'lite';

        console.log(`[WindowManager] toggleChat: layout=${layout}, target=${target}, current chatVisible=${this.chatVisible}`);

        if (this.chatVisible) {
            console.log(`[WindowManager] toggleChat: Hiding ${target}`);
            this.hideWindow(target);
            return { visible: false };
        } else {
            console.log(`[WindowManager] toggleChat: Showing ${target}`);
            this.hideWindow(other); // Ensure other layout is hidden
            await this.showWindow(target);
            return { visible: true };
        }
    }

    closeWindow(windowType) {
        const window = this.windows.get(windowType);
        if (window && !window.isDestroyed()) {
            window.close();
            this.windows.delete(windowType);
            return true;
        }
        return false;
    }

    hideFloatingButton() {
        const mainWindow = this.windows.get('main');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('hide-floating-button');
        }
    }

    showFloatingButton() {
        const mainWindow = this.windows.get('main');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('show-floating-button');
        }
    }

    hideFloatingButtonIfEnabled() {
        const mainWindow = this.windows.get('main');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('hide-floating-button-if-enabled');
        }
    }

    showFloatingButtonIfEnabled() {
        const mainWindow = this.windows.get('main');
        if (mainWindow && !mainWindow.isDestroyed()) {
            const enabled = global.appSettings?.floatingButtonVisible !== false;
            console.log(`[WindowManager] showFloatingButtonIfEnabled - floatingButtonVisible=${enabled}`);
            if (enabled) {

                mainWindow.webContents.send('show-floating-button');
            } else {
                console.log('[WindowManager] Skipping showFloatingButtonIfEnabled: floating button disabled in settings');
            }
        }
    }

    setInteractive(interactive) {
        if (this.isInteractive === interactive) return;
        this.isInteractive = interactive;
        const mainWindow = this.windows.get('main');
        if (mainWindow && !mainWindow.isDestroyed()) {

            mainWindow.setIgnoreMouseEvents(!interactive, { forward: !interactive });

            mainWindow.webContents.send('interaction-mode-changed', { interactive });
        }
    }

    setOverlayInteractive(interactive) {
        this.setInteractive(interactive);
    }

    showVisualEffect(effectType) {
        const enabled = global.appSettings?.edgeGlowEnabled !== false;
        console.log('[WindowManager] showVisualEffect called:', effectType, 'edgeGlowEnabled=', enabled);

        if (!enabled && effectType !== 'task-inactive') {
            console.log('[WindowManager] Skipping showVisualEffect because edge glow disabled in settings');
            return;
        }
        const mainWindow = this.windows.get('main');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('show-visual-effect', { type: effectType });
        }
    }

    closeAllWindows() {
        this.windows.forEach((window, type) => {
            if (window && !window.isDestroyed()) {
                window.removeAllListeners();
                window.destroy();
            }
        });
        this.windows.clear();
    }

    getWindow(windowType) {
        return this.windows.get(windowType);
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    updateAllWindowVisibility(visible) {
        console.log(`[WindowManager] updateAllWindowVisibility: ${visible}`);
        this.windows.forEach((window, name) => {
            if (window && !window.isDestroyed()) {
                if (name === 'entry') return;
                try {
                    window.setContentProtection(!visible);
                    window.setVisibleOnAllWorkspaces(visible, { visibleOnFullScreen: true });

                    const isAlwaysOnTop = window.isAlwaysOnTop();
                    window.setAlwaysOnTop(!isAlwaysOnTop);
                    setTimeout(() => {
                        if (!window.isDestroyed()) {
                            window.setAlwaysOnTop(isAlwaysOnTop);
                        }
                    }, 100);
                } catch (e) {
                    console.error('[WindowManager] Failed to update visibility for window:', e);
                }
            }
        });
    }
}

module.exports = WindowManager;
