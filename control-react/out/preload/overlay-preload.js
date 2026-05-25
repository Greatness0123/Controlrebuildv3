"use strict";
const electron = require("electron");
const overlayAPI = {
  confirmAction: (confirmed) => electron.ipcRenderer.invoke("confirm-action", confirmed),
  onHideFloatingButton: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("hide-floating-button", handler);
    return () => electron.ipcRenderer.removeListener("hide-floating-button", handler);
  },
  onShowFloatingButton: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("show-floating-button", handler);
    return () => electron.ipcRenderer.removeListener("show-floating-button", handler);
  },
  onInteractionModeChanged: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("interaction-mode-changed", handler);
    return () => electron.ipcRenderer.removeListener("interaction-mode-changed", handler);
  },
  onShowVisualEffect: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("show-visual-effect", handler);
    return () => electron.ipcRenderer.removeListener("show-visual-effect", handler);
  },
  onRequestPinAndToggle: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("request-pin-and-toggle", handler);
    return () => electron.ipcRenderer.removeListener("request-pin-and-toggle", handler);
  },
  onFloatingButtonToggle: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("floating-button-toggle", handler);
    return () => electron.ipcRenderer.removeListener("floating-button-toggle", handler);
  },
  onActionStart: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("action-start", handler);
    return () => electron.ipcRenderer.removeListener("action-start", handler);
  },
  setOverlayHover: (isHover) => electron.ipcRenderer.send("overlay-hover", isHover),
  setOverlayFocus: () => electron.ipcRenderer.send("overlay-focus"),
  dragWindow: (delta) => electron.ipcRenderer.send("window-drag", delta),
  verifyPin: (pin) => electron.ipcRenderer.invoke("verify-pin", pin),
  unlockApp: (pin) => electron.ipcRenderer.invoke("unlock-app", pin),
  onShowPromptRequest: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("show-prompt-request", handler);
    return () => electron.ipcRenderer.removeListener("show-prompt-request", handler);
  }
};
electron.contextBridge.exposeInMainWorld("overlayAPI", overlayAPI);
