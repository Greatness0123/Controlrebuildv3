const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('entryAPI', {

    verifyEntryID: (entryId) => ipcRenderer.invoke('verify-entry-id', entryId),
    authenticateUser: (userId) => ipcRenderer.invoke('authenticate-user', userId),
    loginWithEmail: (email, password) => ipcRenderer.invoke('login-with-email', email, password),
    getUserInfo: () => ipcRenderer.invoke('get-user-info'),

    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window', 'entry'),

    dragWindow: (delta) => ipcRenderer.send('window-drag', delta),

    openWebsite: () => ipcRenderer.invoke('open-website'),

    quitApp: () => ipcRenderer.invoke('quit-app'),

    getPlatform: () => process.platform,
});
