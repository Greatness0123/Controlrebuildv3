import { contextBridge, ipcRenderer } from 'electron';
import { EntryAPI } from '../../src/types/preload-apis';

const entryAPI: EntryAPI = {
  loginWithEmail: (email, password) => ipcRenderer.invoke('login-with-email', email, password),
  authenticateUser: (userId) => ipcRenderer.invoke('authenticate-user', userId),
  verifyEntryId: (entryId) => ipcRenderer.invoke('verify-entry-id', entryId),
  getUserInfo: () => ipcRenderer.invoke('get-user-info'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: (windowType) => ipcRenderer.invoke('close-window', windowType),
  dragWindow: (delta) => ipcRenderer.send('window-drag', delta),
  onUserChanged: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('user-changed', handler);
    return () => ipcRenderer.removeListener('user-changed', handler);
  },
};

contextBridge.exposeInMainWorld('entryAPI', entryAPI);
