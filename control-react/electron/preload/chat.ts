import { contextBridge, ipcRenderer } from 'electron';
import { ChatAPI } from '../../src/types/preload-apis';

const chatAPI: ChatAPI = {
  executeTask: (task, mode) => ipcRenderer.invoke('execute-task', task, mode),
  stopTask: () => ipcRenderer.invoke('stop-task'),
  stopAction: () => ipcRenderer.invoke('stop-action'),
  confirmAction: (confirmed) => ipcRenderer.invoke('confirm-action', confirmed),
  stopAudio: () => ipcRenderer.invoke('stop-audio'),
  setWakewordEnabled: (enabled) => ipcRenderer.invoke('set-wakeword-enabled', enabled),
  closeChat: () => ipcRenderer.invoke('close-window', 'chat'),
  hideChat: () => ipcRenderer.invoke('hide-window', 'chat'),
  showChat: () => ipcRenderer.invoke('show-window', 'chat'),
  showSettings: () => ipcRenderer.invoke('show-window', 'settings'),
  dragWindow: (delta) => ipcRenderer.send('window-drag', delta),
  shouldSpeakGreeting: () => ipcRenderer.invoke('should-speak-greeting'),
  speakGreeting: (text) => ipcRenderer.invoke('speak-greeting', text),
  importSkill: () => ipcRenderer.invoke('import-skill'),
  isAppLocked: () => ipcRenderer.invoke('is-app-locked'),
  readBehaviors: () => ipcRenderer.invoke('read-behaviors'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  showWindow: (windowType) => ipcRenderer.invoke('show-window', windowType),
  showGhostCursor: () => ipcRenderer.invoke('show-ghost-cursor'),
  hideGhostCursor: () => ipcRenderer.invoke('hide-ghost-cursor'),
  updateGhostCursor: (data) => ipcRenderer.invoke('update-ghost-cursor', data),
  newConversation: () => ipcRenderer.invoke('new-conversation'),
  browserNavigate: (url) => ipcRenderer.invoke('browser-navigate', url),
  browserExecuteJs: (script) => ipcRenderer.invoke('browser-execute-js', script),
  browserGetStatus: () => ipcRenderer.invoke('browser-get-status'),
  browserClose: () => ipcRenderer.invoke('browser-close'),
  getToolSchemas: () => ipcRenderer.invoke('get-tool-schemas'),
  getToolNames: () => ipcRenderer.invoke('get-tool-names'),
  executeTool: (toolName, params) => ipcRenderer.invoke('execute-tool', toolName, params),
  validateToolParams: (toolName, params) => ipcRenderer.invoke('validate-tool-params', toolName, params),
  getUserInfo: () => ipcRenderer.invoke('get-user-info'),
  showPromptModal: (message, defaultValue, options) => ipcRenderer.invoke('show-prompt-modal', message, defaultValue, options),

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
  onTranscriptionResult: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('transcription-result', handler);
    return () => ipcRenderer.removeListener('transcription-result', handler);
  },
  onActionStart: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('action-start', handler);
    return () => ipcRenderer.removeListener('action-start', handler);
  },
  onActionStep: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('action-step', handler);
    return () => ipcRenderer.removeListener('action-step', handler);
  },
  onActionComplete: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('action-complete', handler);
    return () => ipcRenderer.removeListener('action-complete', handler);
  },
  onTaskStart: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('task-start', handler);
    return () => ipcRenderer.removeListener('task-start', handler);
  },
  onTaskComplete: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('task-complete', handler);
    return () => ipcRenderer.removeListener('task-complete', handler);
  },
  onTaskStopped: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('task-stopped', handler);
    return () => ipcRenderer.removeListener('task-stopped', handler);
  },
  onBackendError: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('backend-error', handler);
    return () => ipcRenderer.removeListener('backend-error', handler);
  },
  onWakewordError: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('wakeword-error', handler);
    return () => ipcRenderer.removeListener('wakeword-error', handler);
  },
  onAfterMessage: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('after-message', handler);
    return () => ipcRenderer.removeListener('after-message', handler);
  },
  onPlanUpdate: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('plan-update', handler);
    return () => ipcRenderer.removeListener('plan-update', handler);
  },
  onRequestConfirmation: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('request-confirmation', handler);
    return () => ipcRenderer.removeListener('request-confirmation', handler);
  },
  onAudioStarted: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('audio-started', handler);
    return () => ipcRenderer.removeListener('audio-started', handler);
  },
  onAudioStopped: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('audio-stopped', handler);
    return () => ipcRenderer.removeListener('audio-stopped', handler);
  },
  onWakeWordDetected: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('wakeword-detected', handler);
    return () => ipcRenderer.removeListener('wakeword-detected', handler);
  },
  onSettingsUpdated: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('settings-updated', handler);
    return () => ipcRenderer.removeListener('settings-updated', handler);
  },
  onUserDataUpdated: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('user-data-updated', handler);
    return () => ipcRenderer.removeListener('user-data-updated', handler);
  },
  onUserChanged: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('user-changed', handler);
    return () => ipcRenderer.removeListener('user-changed', handler);
  },
  onSkillsUpdated: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('skills-updated', handler);
    return () => ipcRenderer.removeListener('skills-updated', handler);
  },
  onAppInitialized: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('app-initialized', handler);
    return () => ipcRenderer.removeListener('app-initialized', handler);
  },
  onWorkflowStarted: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('workflow-started', handler);
    return () => ipcRenderer.removeListener('workflow-started', handler);
  },
  onShowPromptRequest: (cb) => {
    const handler = (event: any, data: any) => cb(event, data);
    ipcRenderer.on('show-prompt-request', handler);
    return () => ipcRenderer.removeListener('show-prompt-request', handler);
  },
  submitPromptResponse: (requestId, value) => ipcRenderer.send(`prompt-response:${requestId}`, value),
  onClickStepStart: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('click-step-start', handler);
    return () => ipcRenderer.removeListener('click-step-start', handler);
  },
  onClickStepComplete: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('click-step-complete', handler);
    return () => ipcRenderer.removeListener('click-step-complete', handler);
  },
  onClickTaskComplete: (cb) => {
    const handler = (event: any) => cb(event);
    ipcRenderer.on('click-task-complete', handler);
    return () => ipcRenderer.removeListener('click-task-complete', handler);
  },
};

contextBridge.exposeInMainWorld('chatAPI', chatAPI);
