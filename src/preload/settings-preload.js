const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {

    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getCurrentUser: () => ipcRenderer.invoke('get-user-info'),

    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', callback),
    onUserChanged: (callback) => ipcRenderer.on('user-changed', callback),
    onPorcupineKeyInvalid: (callback) => ipcRenderer.on('porcupine-key-invalid', callback),

    updateFloatingButton: (visible) => ipcRenderer.invoke('update-floating-button', visible),
    onFloatingButtonToggle: (callback) => ipcRenderer.on('floating-button-toggle', callback),

    verifyPin: (pin) => ipcRenderer.invoke('verify-pin', pin),
    setSecurityPin: (pin) => ipcRenderer.invoke('set-security-pin', pin),
    enableSecurityPin: (enabled) => ipcRenderer.invoke('enable-security-pin', enabled),
    changePin: (currentPin, newPin) => ipcRenderer.invoke('change-pin', currentPin, newPin),

    lockApp: () => ipcRenderer.invoke('lock-app'),
    logout: () => ipcRenderer.invoke('logout'),
    quitApp: () => ipcRenderer.invoke('quit-app'),
    restartApp: () => ipcRenderer.invoke('restart-app'),
    newConversation: () => ipcRenderer.invoke('new-conversation'),

    setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),

    updateHotkeys: (hotkeys) => ipcRenderer.invoke('update-hotkeys', hotkeys),

    closeSettings: () => ipcRenderer.send('close-settings'),
    dragWindow: (delta) => ipcRenderer.send('window-drag', delta),

    openWebsite: () => ipcRenderer.invoke('open-website'),
    openExternal: (url) => ipcRenderer.invoke('open-external-url', url),

    getPicovoiceKey: () => ipcRenderer.invoke('get-picovoice-key'),
    setPicovoiceKey: (key) => ipcRenderer.invoke('set-picovoice-key', key),
    validatePicovoiceKey: (key) => ipcRenderer.invoke('validate-picovoice-key', key),

    getRemotePairingCode: (deviceName, forceRegenerate) => ipcRenderer.invoke('get-remote-pairing-code', deviceName, forceRegenerate),
    toggleRemoteAccess: (enabled) => ipcRenderer.invoke('toggle-remote-access', enabled),
    getRemoteStatus: () => ipcRenderer.invoke('get-remote-status'),

    setWindowVisibility: (visible) => ipcRenderer.invoke('set-window-visibility', visible),

    getTTSVoices: () => ipcRenderer.invoke('tts-get-voices'),
    testVoice: (voice, rate, volume) => ipcRenderer.invoke('tts-test-voice', voice, rate, volume),

    exportData: () => ipcRenderer.invoke('export-data'),
    deleteAllData: () => ipcRenderer.invoke('delete-all-data'),
    importSkill: () => ipcRenderer.invoke('import-skill'),
    uploadSkillFolder: () => ipcRenderer.invoke('upload-skill-folder'),
    deleteSkill: (name) => ipcRenderer.invoke('delete-skill', name),
    getSkills: () => ipcRenderer.invoke('read-behaviors'),
    showConfirmModal: (options) => ipcRenderer.invoke('show-confirm-modal', options),
    promptModal: (message, defaultValue, options) => ipcRenderer.invoke('show-prompt-modal', message, defaultValue, options),
    setModalActive: (active) => ipcRenderer.invoke('set-modal-active', active),
});
