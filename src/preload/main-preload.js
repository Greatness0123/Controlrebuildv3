const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    showFloatingButton: () => ipcRenderer.send('show-floating-button'),
    hideFloatingButton: () => ipcRenderer.send('hide-floating-button'),
    toggleChat: () => ipcRenderer.invoke('toggle-chat'), // ✅ Single function handles both cases
    openEntryWindow: () => ipcRenderer.invoke('show-window', 'entry'),

    onVisualEffect: (callback) => ipcRenderer.on('show-visual-effect', callback),
    onInteractionModeChanged: (callback) => ipcRenderer.on('interaction-mode-changed', callback),
    onShowFloatingButton: (callback) => ipcRenderer.on('show-floating-button', callback),
    onHideFloatingButton: (callback) => ipcRenderer.on('hide-floating-button', callback),
    onShowFloatingButtonIfEnabled: (callback) => ipcRenderer.on('show-floating-button-if-enabled', callback),
    onHideFloatingButtonIfEnabled: (callback) => ipcRenderer.on('hide-floating-button-if-enabled', callback),
    onFloatingButtonToggle: (callback) => ipcRenderer.on('floating-button-toggle', callback),
    onRequestPinAndToggle: (callback) => ipcRenderer.on('request-pin-and-toggle', callback),

    overlayHover: (isHover) => ipcRenderer.send('overlay-hover', isHover),

    getPlatform: () => process.platform,
    getVersion: () => ipcRenderer.invoke('get-app-version'),

    getSettings: () => ipcRenderer.invoke('get-settings'),
    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', callback),
    verifyPin: (pin) => ipcRenderer.invoke('verify-pin', pin),
    verifyEntryID: (id) => ipcRenderer.invoke('verify-entry-id', id),
    isAppLocked: () => ipcRenderer.invoke('is-app-locked'),
    unlockApp: (pin) => ipcRenderer.invoke('unlock-app', pin),

    focusOverlay: () => ipcRenderer.send('overlay-focus'),

    onActionStart: (callback) => ipcRenderer.on('action-start', callback),
    onActionStep: (callback) => ipcRenderer.on('action-step', callback),
    onActionComplete: (callback) => ipcRenderer.on('action-complete', callback),
    onTaskStart: (callback) => ipcRenderer.on('task-start', callback),
    onTaskComplete: (callback) => ipcRenderer.on('task-complete', callback),
    onTaskStopped: (callback) => ipcRenderer.on('task-stopped', callback),

    onAIResponse: (callback) => ipcRenderer.on('ai-response', callback),
});

contextBridge.exposeInMainWorld('openEntryWindow', () => ipcRenderer.invoke('show-window', 'entry'));
