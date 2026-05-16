import { MainHandlers, RendererEvents } from '../src/types/ipc';

export interface ChatAPI {
  // Handlers
  executeTask: MainHandlers['execute-task'];
  stopTask: MainHandlers['stop-task'];
  stopAction: MainHandlers['stop-action'];
  confirmAction: MainHandlers['confirm-action'];
  stopAudio: MainHandlers['stop-audio'];
  setWakewordEnabled: MainHandlers['set-wakeword-enabled'];
  closeChat: () => Promise<{ success: boolean }>;
  hideChat: () => Promise<{ success: boolean }>;
  showChat: () => Promise<{ success: boolean }>;
  showSettings: () => Promise<{ success: boolean }>;
  dragWindow: (delta: { deltaX: number; deltaY: number }) => void;
  shouldSpeakGreeting: MainHandlers['should-speak-greeting'];
  speakGreeting: MainHandlers['speak-greeting'];
  importSkill: MainHandlers['import-skill'];
  isAppLocked: MainHandlers['is-app-locked'];
  readBehaviors: MainHandlers['read-behaviors'];
  getSettings: MainHandlers['get-settings'];
  saveSettings: MainHandlers['save-settings'];
  showWindow: MainHandlers['show-window'];
  showGhostCursor: MainHandlers['show-ghost-cursor'];
  hideGhostCursor: MainHandlers['hide-ghost-cursor'];
  updateGhostCursor: MainHandlers['update-ghost-cursor'];
  newConversation: MainHandlers['new-conversation'];
  browserNavigate: MainHandlers['browser-navigate'];
  browserExecuteJs: MainHandlers['browser-execute-js'];
  browserGetStatus: MainHandlers['browser-get-status'];
  browserClose: MainHandlers['browser-close'];
  getToolSchemas: MainHandlers['get-tool-schemas'];
  getToolNames: MainHandlers['get-tool-names'];
  executeTool: MainHandlers['execute-tool'];
  validateToolParams: MainHandlers['validate-tool-params'];
  getUserInfo: MainHandlers['get-user-info'];

  // Events
  onAIResponse: (cb: (event: any, data: RendererEvents['ai-response']) => void) => () => void;
  onAIStream: (cb: (event: any, data: RendererEvents['ai-stream']) => void) => () => void;
  onTranscriptionResult: (cb: (event: any, data: RendererEvents['transcription-result']) => void) => () => void;
  onActionStart: (cb: (event: any, data: RendererEvents['action-start']) => void) => () => void;
  onActionStep: (cb: (event: any, data: RendererEvents['action-step']) => void) => () => void;
  onActionComplete: (cb: (event: any, data: RendererEvents['action-complete']) => void) => () => void;
  onTaskStart: (cb: (event: any, data: RendererEvents['task-start']) => void) => () => void;
  onTaskComplete: (cb: (event: any, data: void) => void) => () => void;
  onTaskStopped: (cb: (event: any, data: void) => void) => () => void;
  onBackendError: (cb: (event: any, data: string) => void) => () => void;
  onWakewordError: (cb: (event: any, data: string) => void) => () => void;
  onAfterMessage: (cb: (event: any, data: RendererEvents['after-message']) => void) => () => void;
  onPlanUpdate: (cb: (event: any, data: any) => void) => () => void;
  onRequestConfirmation: (cb: (event: any, data: any) => void) => () => void;
  onAudioStarted: (cb: (event: any, data: void) => void) => () => void;
  onAudioStopped: (cb: (event: any, data: RendererEvents['audio-stopped']) => void) => () => void;
  onWakeWordDetected: (cb: (event: any, data: RendererEvents['wakeword-detected']) => void) => () => void;
  onSettingsUpdated: (cb: (event: any, data: RendererEvents['settings-updated']) => void) => () => void;
  onUserDataUpdated: (cb: (event: any, data: RendererEvents['user-data-updated']) => void) => () => void;
  onUserChanged: (cb: (event: any, data: RendererEvents['user-changed']) => void) => () => void;
  onSkillsUpdated: (cb: (event: any, data: void) => void) => () => void;
  onAppInitialized: (cb: (event: any, data: void) => void) => () => void;
  onWorkflowStarted: (cb: (event: any, data: RendererEvents['workflow-started']) => void) => () => void;
  onClickStepStart: (cb: (event: any, data: void) => void) => () => void;
  onClickStepComplete: (cb: (event: any, data: void) => void) => () => void;
  onClickTaskComplete: (cb: (event: any, data: void) => void) => () => void;
}

export interface EntryAPI {
  loginWithEmail: MainHandlers['login-with-email'];
  authenticateUser: MainHandlers['authenticate-user'];
  verifyEntryId: MainHandlers['verify-entry-id'];
  getUserInfo: MainHandlers['get-user-info'];
  minimizeWindow: MainHandlers['minimize-window'];
  maximizeWindow: MainHandlers['maximize-window'];
  closeWindow: MainHandlers['close-window'];
  dragWindow: (delta: { deltaX: number; deltaY: number }) => void;
  onUserChanged: (cb: (event: any, data: RendererEvents['user-changed']) => void) => () => void;
}

export interface SettingsAPI {
  getSettings: MainHandlers['get-settings'];
  saveSettings: MainHandlers['save-settings'];
  updateHotkeys: MainHandlers['update-hotkeys'];
  updateFloatingButton: MainHandlers['update-floating-button'];
  setAutoStart: MainHandlers['set-auto-start'];
  setWindowVisibility: MainHandlers['set-window-visibility'];
  getAppVersion: MainHandlers['get-app-version'];
  getPicovoiceKey: MainHandlers['get-picovoice-key'];
  setPicovoiceKey: MainHandlers['set-picovoice-key'];
  validatePicovoiceKey: MainHandlers['validate-picovoice-key'];
  ttsStop: MainHandlers['tts-stop'];
  ttsGetVoices: MainHandlers['tts-get-voices'];
  ttsSetVoice: MainHandlers['tts-set-voice'];
  ttsSetRate: MainHandlers['tts-set-rate'];
  ttsSetVolume: MainHandlers['tts-set-volume'];
  ttsTestVoice: MainHandlers['tts-test-voice'];
  logout: MainHandlers['logout'];
  lockApp: MainHandlers['lock-app'];
  deleteAllData: MainHandlers['delete-all-data'];
  exportData: MainHandlers['export-data'];
  restartApp: MainHandlers['restart-app'];
  quitApp: MainHandlers['quit-app'];
  openWebsite: MainHandlers['open-website'];
  closeSettings: () => void;
  enableSecurityPin: MainHandlers['enable-security-pin'];
  setSecurityPin: MainHandlers['set-security-pin'];
  changePin: MainHandlers['change-pin'];
  getRemotePairingCode: MainHandlers['get-remote-pairing-code'];
  toggleRemoteAccess: MainHandlers['toggle-remote-access'];
  getRemoteStatus: MainHandlers['get-remote-status'];
  dragWindow: (delta: { deltaX: number; deltaY: number }) => void;
  onSettingsUpdated: (cb: (event: any, data: RendererEvents['settings-updated']) => void) => () => void;
  onSkillsUpdated: (cb: (event: any, data: void) => void) => () => void;
}

export interface OverlayAPI {
  confirmAction: MainHandlers['confirm-action'];
  onHideFloatingButton: (cb: (event: any) => void) => () => void;
  onShowFloatingButton: (cb: (event: any) => void) => () => void;
  onInteractionModeChanged: (cb: (event: any, data: RendererEvents['interaction-mode-changed']) => void) => () => void;
  onShowVisualEffect: (cb: (event: any, data: RendererEvents['show-visual-effect']) => void) => () => void;
  onRequestPinAndToggle: (cb: (event: any) => void) => () => void;
  onFloatingButtonToggle: (cb: (event: any, data: boolean) => void) => () => void;
  onActionStart: (cb: (event: any, data: RendererEvents['action-start']) => void) => () => void;
  setOverlayHover: (isHover: boolean) => void;
  setOverlayFocus: () => void;
  dragWindow: (delta: { deltaX: number; deltaY: number }) => void;
}

export interface GhostCursorAPI {
  initGhostCursorSettings: MainHandlers['init-ghost-cursor-settings'];
  onStartIdle: (cb: (event: any) => void) => () => void;
  onInitSettings: (cb: (event: any, data: RendererEvents['ghost-cursor:init-settings']) => void) => () => void;
  onMouseMove: (cb: (event: any, data: RendererEvents['ghost-cursor:mouse-move']) => void) => () => void;
  onMove: (cb: (event: any, data: RendererEvents['ghost-cursor:move']) => void) => () => void;
  onUpdateText: (cb: (event: any, data: RendererEvents['ghost-cursor:update-text']) => void) => () => void;
  onSetGuiding: (cb: (event: any, data: RendererEvents['ghost-cursor:set-guiding']) => void) => () => void;
  stepCompleted: () => void;
}

export interface LiteAPI {
  executeTask: MainHandlers['execute-task'];
  stopTask: MainHandlers['stop-task'];
  onAIResponse: (cb: (event: any, data: RendererEvents['ai-response']) => void) => () => void;
  onAIStream: (cb: (event: any, data: RendererEvents['ai-stream']) => void) => () => void;
  dragWindow: (delta: { deltaX: number; deltaY: number }) => void;
}

export interface WorkflowAPI {
  getAllWorkflows: MainHandlers['get-all-workflows'];
  saveWorkflow: MainHandlers['save-workflow'];
  deleteWorkflow: MainHandlers['delete-workflow'];
  toggleWorkflow: MainHandlers['toggle-workflow'];
  executeWorkflow: MainHandlers['execute-workflow'];
  exportWorkflow: MainHandlers['export-workflow'];
  pickItem: MainHandlers['pick-item'];
  getInstalledApps: MainHandlers['get-installed-apps'];
  getCachedApps: MainHandlers['get-cached-apps'];
  dragWindow: (delta: { deltaX: number; deltaY: number }) => void;
}
