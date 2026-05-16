import { contextBridge, ipcRenderer } from 'electron';
import { WorkflowAPI } from '../../src/types/preload-apis';

const workflowAPI: WorkflowAPI = {
  getAllWorkflows: () => ipcRenderer.invoke('get-all-workflows'),
  saveWorkflow: (workflow) => ipcRenderer.invoke('save-workflow', workflow),
  deleteWorkflow: (id) => ipcRenderer.invoke('delete-workflow', id),
  toggleWorkflow: (id, enabled) => ipcRenderer.invoke('toggle-workflow', id, enabled),
  executeWorkflow: (id) => ipcRenderer.invoke('execute-workflow', id),
  exportWorkflow: (id) => ipcRenderer.invoke('export-workflow', id),
  pickItem: (type) => ipcRenderer.invoke('pick-item', type),
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  getCachedApps: () => ipcRenderer.invoke('get-cached-apps'),
  dragWindow: (delta) => ipcRenderer.send('window-drag', delta),
};

contextBridge.exposeInMainWorld('workflowAPI', workflowAPI);
