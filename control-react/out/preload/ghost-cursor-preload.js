"use strict";
const electron = require("electron");
const ghostCursorAPI = {
  initGhostCursorSettings: () => electron.ipcRenderer.invoke("init-ghost-cursor-settings"),
  onStartIdle: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("ghost-cursor:start-idle", handler);
    return () => electron.ipcRenderer.removeListener("ghost-cursor:start-idle", handler);
  },
  onInitSettings: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ghost-cursor:init-settings", handler);
    return () => electron.ipcRenderer.removeListener("ghost-cursor:init-settings", handler);
  },
  onMouseMove: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ghost-cursor:mouse-move", handler);
    return () => electron.ipcRenderer.removeListener("ghost-cursor:mouse-move", handler);
  },
  onMove: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ghost-cursor:move", handler);
    return () => electron.ipcRenderer.removeListener("ghost-cursor:move", handler);
  },
  onUpdateText: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ghost-cursor:update-text", handler);
    return () => electron.ipcRenderer.removeListener("ghost-cursor:update-text", handler);
  },
  onSetGuiding: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ghost-cursor:set-guiding", handler);
    return () => electron.ipcRenderer.removeListener("ghost-cursor:set-guiding", handler);
  },
  stepCompleted: () => electron.ipcRenderer.send("ghost-cursor:step-completed")
};
electron.contextBridge.exposeInMainWorld("ghostCursorAPI", ghostCursorAPI);
