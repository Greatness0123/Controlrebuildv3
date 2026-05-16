export interface AppSettings {
  pinEnabled: boolean;
  voiceActivation: boolean;
  voiceResponse: boolean;
  muteNotifications: boolean;
  greetingTTS: boolean;
  autoSendAfterWakeWord: boolean;
  proceedWithoutConfirmation: boolean;
  lastMode: 'ask' | 'act' | 'click';
  windowVisibility: boolean;
  openAtLogin: boolean;
  wakeWordToggleChat: boolean;
  floatingButtonVisible: boolean;
  edgeGlowEnabled: boolean;
  borderStreakEnabled: boolean;
  overlayPillEnabled: boolean;
  workflowTriggersEnabled: boolean;
  theme: 'light' | 'dark';
  modelProvider: string;
  selectedModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  openrouterModel: string;
  openrouterCustomModel: string;
  openrouterApiKey: string;
  ollamaEnabled: boolean;
  ollamaUrl: string;
  ollamaModel: string;
  ttsVoice: string;
  ttsRate: number;
  ttsVolume: number;
  userAuthenticated: boolean;
  hotkeys: Hotkeys;
  remoteAccessEnabled: boolean;
  controlBackendUrl: string;
  userDetails: any;
  ghostCursorEnabled: boolean;
  ghostCursorColor: string;
  ghostCursorOutlineColor: string;
  ghostCursorOpacity: number;
  ghostCursorSize: 'small' | 'medium' | 'large';
  ghostCursorBubbleBg: string;
  ghostCursorBubbleTextColor: string;
  ghostCursorCustomImage: string | null;
  // Provider-specific settings
  universalApiKey?: string;
  universalModel?: string;
  universalBaseUrl?: string;
  cloudRegion?: string;
  cloudCredentials?: string;
  cloudModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  xaiApiKey?: string;
  xaiModel?: string;
  deepseekApiKey?: string;
  deepseekModel?: string;
  moonshotApiKey?: string;
  moonshotModel?: string;
  zaiApiKey?: string;
  zaiModel?: string;
  litellmApiKey?: string;
  litellmModel?: string;
  minimaxApiKey?: string;
  minimaxModel?: string;
  lmstudioApiKey?: string;
  lmstudioModel?: string;
}

export interface Hotkeys {
  toggleChat: string;
  stopAction: string;
}

export interface Voice {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
}
