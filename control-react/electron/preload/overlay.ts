import { contextBridge, ipcRenderer } from 'electron';
import { OverlayAPI } from '../../src/types/preload-apis';

const overlayAPI: OverlayAPI = {
  confirmAction: (confirmed) => ipcRenderer.invoke('confirm-action', confirmed),
  onHideFloatingButton: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('hide-floating-button', handler);
    return () => ipcRenderer.removeListener('hide-floating-button', handler);
  },
  onShowFloatingButton: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('show-floating-button', handler);
    return () => ipcRenderer.removeListener('show-floating-button', handler);
  },
  onInteractionModeChanged: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('interaction-mode-changed', handler);
    return () => ipcRenderer.removeListener('interaction-mode-changed', handler);
  },
  onShowVisualEffect: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('show-visual-effect', handler);
    return () => ipcRenderer.removeListener('show-visual-effect', handler);
  },
  onRequestPinAndToggle: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('request-pin-and-toggle', handler);
    return () => ipcRenderer.removeListener('request-pin-and-toggle', handler);
  },
  onFloatingButtonToggle: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('floating-button-toggle', handler);
    return () => ipcRenderer.removeListener('floating-button-toggle', handler);
  },
  onActionStart: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('action-start', handler);
    return () => ipcRenderer.removeListener('action-start', handler);
  },
  setOverlayHover: (isHover) => ipcRenderer.send('overlay-hover', isHover),
  setOverlayFocus: () => ipcRenderer.send('overlay-focus'),
  dragWindow: (delta) => ipcRenderer.send('window-drag', delta),
};

contextBridge.exposeInMainWorld('overlayAPI', overlayAPI);
