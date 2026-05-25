"use strict";
const electron = require("electron");
const workflowAPI = {
  getAllWorkflows: () => electron.ipcRenderer.invoke("get-all-workflows"),
  saveWorkflow: (workflow) => electron.ipcRenderer.invoke("save-workflow", workflow),
  deleteWorkflow: (id) => electron.ipcRenderer.invoke("delete-workflow", id),
  toggleWorkflow: (id, enabled) => electron.ipcRenderer.invoke("toggle-workflow", id, enabled),
  executeWorkflow: (id) => electron.ipcRenderer.invoke("execute-workflow", id),
  exportWorkflow: (id) => electron.ipcRenderer.invoke("export-workflow", id),
  importWorkflow: () => electron.ipcRenderer.invoke("import-workflow"),
  pickItem: (type) => electron.ipcRenderer.invoke("pick-item", type),
  getInstalledApps: () => electron.ipcRenderer.invoke("get-installed-apps"),
  getCachedApps: () => electron.ipcRenderer.invoke("get-cached-apps"),
  dragWindow: (delta) => electron.ipcRenderer.send("window-drag", delta)
};
electron.contextBridge.exposeInMainWorld("workflowAPI", workflowAPI);
