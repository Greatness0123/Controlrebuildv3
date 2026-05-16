import { contextBridge, ipcRenderer } from 'electron';
import { GhostCursorAPI } from '../../src/types/preload-apis';

const ghostCursorAPI: GhostCursorAPI = {
  initGhostCursorSettings: () => ipcRenderer.invoke('init-ghost-cursor-settings'),
  onStartIdle: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('ghost-cursor:start-idle', handler);
    return () => ipcRenderer.removeListener('ghost-cursor:start-idle', handler);
  },
  onInitSettings: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ghost-cursor:init-settings', handler);
    return () => ipcRenderer.removeListener('ghost-cursor:init-settings', handler);
  },
  onMouseMove: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ghost-cursor:mouse-move', handler);
    return () => ipcRenderer.removeListener('ghost-cursor:mouse-move', handler);
  },
  onMove: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ghost-cursor:move', handler);
    return () => ipcRenderer.removeListener('ghost-cursor:move', handler);
  },
  onUpdateText: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ghost-cursor:update-text', handler);
    return () => ipcRenderer.removeListener('ghost-cursor:update-text', handler);
  },
  onSetGuiding: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ghost-cursor:set-guiding', handler);
    return () => ipcRenderer.removeListener('ghost-cursor:set-guiding', handler);
  },
  stepCompleted: () => ipcRenderer.send('ghost-cursor:step-completed'),
};

contextBridge.exposeInMainWorld('ghostCursorAPI', ghostCursorAPI);
