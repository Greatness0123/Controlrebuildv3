"use strict";
const electron = require("electron");
const liteAPI = {
  executeTask: (task, mode) => electron.ipcRenderer.invoke("execute-task", task, mode),
  stopTask: () => electron.ipcRenderer.invoke("stop-task"),
  onAIResponse: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ai-response", handler);
    return () => electron.ipcRenderer.removeListener("ai-response", handler);
  },
  onAIStream: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("ai-stream", handler);
    return () => electron.ipcRenderer.removeListener("ai-stream", handler);
  },
  dragWindow: (delta) => electron.ipcRenderer.send("window-drag", delta)
};
electron.contextBridge.exposeInMainWorld("liteAPI", liteAPI);
