"use strict";
const electron = require("electron");
const chatAPI = {
  executeTask: (task, mode) => electron.ipcRenderer.invoke("execute-task", task, mode),
  stopTask: () => electron.ipcRenderer.invoke("stop-task"),
  stopAction: () => electron.ipcRenderer.invoke("stop-action"),
  confirmAction: (confirmed) => electron.ipcRenderer.invoke("confirm-action", confirmed),
  stopAudio: () => electron.ipcRenderer.invoke("stop-audio"),
  setWakewordEnabled: (enabled) => electron.ipcRenderer.invoke("set-wakeword-enabled", enabled),
  closeChat: () => electron.ipcRenderer.invoke("close-window", "chat"),
  hideChat: () => electron.ipcRenderer.invoke("hide-window", "chat"),
  showChat: () => electron.ipcRenderer.invoke("show-window", "chat"),
  showSettings: () => electron.ipcRenderer.invoke("show-window", "settings"),
  dragWindow: (delta) => electron.ipcRenderer.send("window-drag", delta),
  shouldSpeakGreeting: () => electron.ipcRenderer.invoke("should-speak-greeting"),
  speakGreeting: (text) => electron.ipcRenderer.invoke("speak-greeting", text),
  importSkill: () => electron.ipcRenderer.invoke("import-skill"),
  isAppLocked: () => electron.ipcRenderer.invoke("is-app-locked"),
  readBehaviors: () => electron.ipcRenderer.invoke("read-behaviors"),
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings),
  showWindow: (windowType) => electron.ipcRenderer.invoke("show-window", windowType),
  showGhostCursor: () => electron.ipcRenderer.invoke("show-ghost-cursor"),
  hideGhostCursor: () => electron.ipcRenderer.invoke("hide-ghost-cursor"),
  updateGhostCursor: (data) => electron.ipcRenderer.invoke("update-ghost-cursor", data),
  newConversation: () => electron.ipcRenderer.invoke("new-conversation"),
  browserNavigate: (url) => electron.ipcRenderer.invoke("browser-navigate", url),
  browserExecuteJs: (script) => electron.ipcRenderer.invoke("browser-execute-js", script),
  browserGetStatus: () => electron.ipcRenderer.invoke("browser-get-status"),
  browserClose: () => electron.ipcRenderer.invoke("browser-close"),
  getToolSchemas: () => electron.ipcRenderer.invoke("get-tool-schemas"),
  getToolNames: () => electron.ipcRenderer.invoke("get-tool-names"),
  executeTool: (toolName, params) => electron.ipcRenderer.invoke("execute-tool", toolName, params),
  validateToolParams: (toolName, params) => electron.ipcRenderer.invoke("validate-tool-params", toolName, params),
  getUserInfo: () => electron.ipcRenderer.invoke("get-user-info"),
  showPromptModal: (message, defaultValue, options) => electron.ipcRenderer.invoke("show-prompt-modal", message, defaultValue, options),
  toggleChat: () => electron.ipcRenderer.invoke("toggle-chat"),
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
  onTranscriptionResult: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("transcription-result", handler);
    return () => electron.ipcRenderer.removeListener("transcription-result", handler);
  },
  onActionStart: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("action-start", handler);
    return () => electron.ipcRenderer.removeListener("action-start", handler);
  },
  onActionStep: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("action-step", handler);
    return () => electron.ipcRenderer.removeListener("action-step", handler);
  },
  onActionComplete: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("action-complete", handler);
    return () => electron.ipcRenderer.removeListener("action-complete", handler);
  },
  onTaskStart: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("task-start", handler);
    return () => electron.ipcRenderer.removeListener("task-start", handler);
  },
  onTaskComplete: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("task-complete", handler);
    return () => electron.ipcRenderer.removeListener("task-complete", handler);
  },
  onTaskStopped: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("task-stopped", handler);
    return () => electron.ipcRenderer.removeListener("task-stopped", handler);
  },
  onBackendError: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("backend-error", handler);
    return () => electron.ipcRenderer.removeListener("backend-error", handler);
  },
  onWakewordError: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("wakeword-error", handler);
    return () => electron.ipcRenderer.removeListener("wakeword-error", handler);
  },
  onAfterMessage: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("after-message", handler);
    return () => electron.ipcRenderer.removeListener("after-message", handler);
  },
  onPlanUpdate: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("plan-update", handler);
    return () => electron.ipcRenderer.removeListener("plan-update", handler);
  },
  onRequestConfirmation: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("request-confirmation", handler);
    return () => electron.ipcRenderer.removeListener("request-confirmation", handler);
  },
  onAudioStarted: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("audio-started", handler);
    return () => electron.ipcRenderer.removeListener("audio-started", handler);
  },
  onAudioStopped: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("audio-stopped", handler);
    return () => electron.ipcRenderer.removeListener("audio-stopped", handler);
  },
  onWakeWordDetected: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("wakeword-detected", handler);
    return () => electron.ipcRenderer.removeListener("wakeword-detected", handler);
  },
  onSettingsUpdated: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("settings-updated", handler);
    return () => electron.ipcRenderer.removeListener("settings-updated", handler);
  },
  onUserDataUpdated: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("user-data-updated", handler);
    return () => electron.ipcRenderer.removeListener("user-data-updated", handler);
  },
  onUserChanged: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("user-changed", handler);
    return () => electron.ipcRenderer.removeListener("user-changed", handler);
  },
  onSkillsUpdated: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("skills-updated", handler);
    return () => electron.ipcRenderer.removeListener("skills-updated", handler);
  },
  onAppInitialized: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("app-initialized", handler);
    return () => electron.ipcRenderer.removeListener("app-initialized", handler);
  },
  onWorkflowStarted: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("workflow-started", handler);
    return () => electron.ipcRenderer.removeListener("workflow-started", handler);
  },
  onShowPromptRequest: (cb) => {
    const handler = (event, data) => cb(event, data);
    electron.ipcRenderer.on("show-prompt-request", handler);
    return () => electron.ipcRenderer.removeListener("show-prompt-request", handler);
  },
  submitPromptResponse: (requestId, value) => electron.ipcRenderer.send(`prompt-response:${requestId}`, value),
  onClickStepStart: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("click-step-start", handler);
    return () => electron.ipcRenderer.removeListener("click-step-start", handler);
  },
  onClickStepComplete: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("click-step-complete", handler);
    return () => electron.ipcRenderer.removeListener("click-step-complete", handler);
  },
  onClickTaskComplete: (cb) => {
    const handler = (event) => cb(event);
    electron.ipcRenderer.on("click-task-complete", handler);
    return () => electron.ipcRenderer.removeListener("click-task-complete", handler);
  }
};
electron.contextBridge.exposeInMainWorld("chatAPI", chatAPI);
