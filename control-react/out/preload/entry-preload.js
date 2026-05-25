"use strict";
const electron = require("electron");
const entryAPI = {
  loginWithEmail: (payload) => electron.ipcRenderer.invoke("login-with-email", payload),
  authenticateUser: (userId) => electron.ipcRenderer.invoke("authenticate-user", userId),
  verifyEntryId: (entryId) => electron.ipcRenderer.invoke("verify-entry-id", entryId),
  getUserInfo: () => electron.ipcRenderer.invoke("get-user-info"),
  minimizeWindow: () => electron.ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => electron.ipcRenderer.invoke("maximize-window"),
  closeWindow: (windowType) => electron.ipcRenderer.invoke("close-window", windowType),
  dragWindow: (delta) => electron.ipcRenderer.send("window-drag", delta),
  onUserChanged: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("user-changed", handler);
    return () => electron.ipcRenderer.removeListener("user-changed", handler);
  }
};
electron.contextBridge.exposeInMainWorld("entryAPI", entryAPI);
