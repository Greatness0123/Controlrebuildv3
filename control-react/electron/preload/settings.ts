import { contextBridge, ipcRenderer } from 'electron';
import { SettingsAPI } from '../../src/types/preload-apis';

const settingsAPI: SettingsAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  updateHotkeys: (hotkeys) => ipcRenderer.invoke('update-hotkeys', hotkeys),
  updateFloatingButton: (visible) => ipcRenderer.invoke('update-floating-button', visible),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  setWindowVisibility: (visible) => ipcRenderer.invoke('set-window-visibility', visible),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPicovoiceKey: () => ipcRenderer.invoke('get-picovoice-key'),
  setPicovoiceKey: (key) => ipcRenderer.invoke('set-picovoice-key', key),
  validatePicovoiceKey: (key) => ipcRenderer.invoke('validate-picovoice-key', key),
  ttsStop: () => ipcRenderer.invoke('tts-stop'),
  ttsGetVoices: () => ipcRenderer.invoke('tts-get-voices'),
  ttsSetVoice: (voice) => ipcRenderer.invoke('tts-set-voice', voice),
  ttsSetRate: (rate) => ipcRenderer.invoke('tts-set-rate', rate),
  ttsSetVolume: (volume) => ipcRenderer.invoke('tts-set-volume', volume),
  ttsTestVoice: (payload) => ipcRenderer.invoke('tts-test-voice', payload),
  logout: () => ipcRenderer.invoke('logout'),
  lockApp: () => ipcRenderer.invoke('lock-app'),
  deleteAllData: () => ipcRenderer.invoke('delete-all-data'),
  exportData: () => ipcRenderer.invoke('export-data'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  openWebsite: () => ipcRenderer.invoke('open-website'),
  closeSettings: () => ipcRenderer.send('close-settings'),
  enableSecurityPin: (enabled) => ipcRenderer.invoke('enable-security-pin', enabled),
  setSecurityPin: (pin) => ipcRenderer.invoke('set-security-pin', pin),
  changePin: (payload) => ipcRenderer.invoke('change-pin', payload),
  getRemotePairingCode: (deviceName) => ipcRenderer.invoke('get-remote-pairing-code', deviceName),
  toggleRemoteAccess: (enabled) => ipcRenderer.invoke('toggle-remote-access', enabled),
  getRemoteStatus: () => ipcRenderer.invoke('get-remote-status'),
  dragWindow: (delta) => ipcRenderer.send('window-drag', delta),
  onSettingsUpdated: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('settings-updated', handler);
    return () => ipcRenderer.removeListener('settings-updated', handler);
  },
  onSkillsUpdated: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('skills-updated', handler);
    return () => ipcRenderer.removeListener('skills-updated', handler);
  },
};

contextBridge.exposeInMainWorld('settingsAPI', settingsAPI);
