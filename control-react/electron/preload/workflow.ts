import { contextBridge, ipcRenderer } from 'electron';
import { WorkflowAPI } from '../../src/types/preload-apis';

const workflowAPI: WorkflowAPI = {
  getAllWorkflows: () => ipcRenderer.invoke('get-all-workflows'),
  saveWorkflow: (workflow: any) => ipcRenderer.invoke('save-workflow', workflow),
  deleteWorkflow: (id: any) => ipcRenderer.invoke('delete-workflow', id),
  toggleWorkflow: (id: any, enabled: any) => ipcRenderer.invoke('toggle-workflow', id, enabled),
  executeWorkflow: (id: any) => ipcRenderer.invoke('execute-workflow', id),
  exportWorkflow: (id: any) => ipcRenderer.invoke('export-workflow', id),
  importWorkflow: () => ipcRenderer.invoke('import-workflow'),
  pickItem: (type: any) => ipcRenderer.invoke('pick-item', type),
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  getCachedApps: () => ipcRenderer.invoke('get-cached-apps'),
  dragWindow: (delta: any) => ipcRenderer.send('window-drag', delta),
};

contextBridge.exposeInMainWorld('workflowAPI', workflowAPI);
