const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostCursorAPI', {
    onMove: (callback) => {
        ipcRenderer.on('ghost-cursor:move', (event, data) => callback(data));
    },
    onUpdateText: (callback) => {
        ipcRenderer.on('ghost-cursor:update-text', (event, data) => callback(data));
    },
    onSetGuiding: (callback) => {
        ipcRenderer.on('ghost-cursor:set-guiding', (event, data) => callback(data));
    },
    onCompleteStep: (callback) => {
        ipcRenderer.on('ghost-cursor:complete-step', (event, data) => callback(data));
    },
    onInitSettings: (callback) => {
        ipcRenderer.on('ghost-cursor:init-settings', (event, data) => callback(data));
        ipcRenderer.on('ghost-cursor-settings-updated', (event, data) => callback(data));
    },
    onStartIdle: (callback) => {
        ipcRenderer.on('ghost-cursor:start-idle', (event, data) => callback(data));
    },
    onMouseMove: (callback) => {
        ipcRenderer.on('ghost-cursor:mouse-move', (event, data) => callback(data));
    },
    requestInitSettings: () => {
        ipcRenderer.invoke('init-ghost-cursor-settings');
    },
    sendStepComplete: () => {
        ipcRenderer.send('ghost-cursor:step-completed');
    }
});