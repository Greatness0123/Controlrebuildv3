"use strict";
const electron = require("electron");
const settingsAPI = {
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings),
  updateHotkeys: (hotkeys) => electron.ipcRenderer.invoke("update-hotkeys", hotkeys),
  updateFloatingButton: (visible) => electron.ipcRenderer.invoke("update-floating-button", visible),
  setAutoStart: (enabled) => electron.ipcRenderer.invoke("set-auto-start", enabled),
  setWindowVisibility: (visible) => electron.ipcRenderer.invoke("set-window-visibility", visible),
  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
  getPicovoiceKey: () => electron.ipcRenderer.invoke("get-picovoice-key"),
  setPicovoiceKey: (key) => electron.ipcRenderer.invoke("set-picovoice-key", key),
  validatePicovoiceKey: (key) => electron.ipcRenderer.invoke("validate-picovoice-key", key),
  ttsStop: () => electron.ipcRenderer.invoke("tts-stop"),
  ttsGetVoices: () => electron.ipcRenderer.invoke("tts-get-voices"),
  ttsSetVoice: (voice) => electron.ipcRenderer.invoke("tts-set-voice", voice),
  ttsSetRate: (rate) => electron.ipcRenderer.invoke("tts-set-rate", rate),
  ttsSetVolume: (volume) => electron.ipcRenderer.invoke("tts-set-volume", volume),
  ttsTestVoice: (payload) => electron.ipcRenderer.invoke("tts-test-voice", payload),
  logout: () => electron.ipcRenderer.invoke("logout"),
  lockApp: () => electron.ipcRenderer.invoke("lock-app"),
  deleteAllData: () => electron.ipcRenderer.invoke("delete-all-data"),
  exportData: () => electron.ipcRenderer.invoke("export-data"),
  restartApp: () => electron.ipcRenderer.invoke("restart-app"),
  quitApp: () => electron.ipcRenderer.invoke("quit-app"),
  openWebsite: () => electron.ipcRenderer.invoke("open-website"),
  closeSettings: () => electron.ipcRenderer.send("close-settings"),
  enableSecurityPin: (enabled) => electron.ipcRenderer.invoke("enable-security-pin", enabled),
  setSecurityPin: (pin) => electron.ipcRenderer.invoke("set-security-pin", pin),
  changePin: (payload) => electron.ipcRenderer.invoke("change-pin", payload),
  getRemotePairingCode: () => electron.ipcRenderer.invoke("get-remote-pairing-code"),
  toggleRemoteAccess: () => electron.ipcRenderer.invoke("toggle-remote-access"),
  getRemoteStatus: () => electron.ipcRenderer.invoke("get-remote-status"),
  dragWindow: (delta) => electron.ipcRenderer.send("window-drag", delta),
  onSettingsUpdated: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("settings-updated", handler);
    return () => electron.ipcRenderer.removeListener("settings-updated", handler);
  },
  onSkillsUpdated: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("skills-updated", handler);
    return () => electron.ipcRenderer.removeListener("skills-updated", handler);
  }
};
electron.contextBridge.exposeInMainWorld("settingsAPI", settingsAPI);
