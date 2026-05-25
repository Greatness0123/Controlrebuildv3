import { contextBridge, ipcRenderer } from 'electron';
import { LiteAPI } from '../../src/types/preload-apis';

const liteAPI: LiteAPI = {
  executeTask: (task: any, mode: any) => ipcRenderer.invoke('execute-task', task, mode),
  stopTask: () => ipcRenderer.invoke('stop-task'),
  onAIResponse: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ai-response', handler);
    return () => ipcRenderer.removeListener('ai-response', handler);
  },
  onAIStream: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('ai-stream', handler);
    return () => ipcRenderer.removeListener('ai-stream', handler);
  },
  dragWindow: (delta) => ipcRenderer.send('window-drag', delta),
};

contextBridge.exposeInMainWorld('liteAPI', liteAPI);
