import { c as create, d as devtools, p as persist, i as immer } from "./immer-zSCVQdSb.js";
const useSettingsStore = create()(
  devtools(
    persist(
      immer((set) => ({
        // Defaults derived from settings-manager.js
        pinEnabled: false,
        voiceActivation: true,
        voiceResponse: true,
        muteNotifications: false,
        greetingTTS: false,
        autoSendAfterWakeWord: false,
        proceedWithoutConfirmation: false,
        lastMode: "act",
        windowVisibility: false,
        openAtLogin: false,
        wakeWordToggleChat: false,
        floatingButtonVisible: true,
        edgeGlowEnabled: true,
        borderStreakEnabled: true,
        overlayPillEnabled: true,
        workflowTriggersEnabled: true,
        theme: "light",
        modelProvider: "gemini",
        openrouterModel: "anthropic/claude-3.5-sonnet",
        openrouterCustomModel: "",
        openrouterApiKey: "",
        ollamaEnabled: false,
        ollamaUrl: "http://localhost:11434",
        ollamaModel: "llama3",
        ttsVoice: "en-US-AriaNeural",
        ttsRate: 1,
        ttsVolume: 1,
        userAuthenticated: false,
        hotkeys: {
          toggleChat: "CommandOrControl+Space",
          stopAction: "Alt+Z"
        },
        remoteAccessEnabled: false,
        controlBackendUrl: "https://control.southafricanorth.cloudapp.azure.com",
        userDetails: null,
        ghostCursorEnabled: true,
        ghostCursorColor: "#0078D4",
        ghostCursorOutlineColor: "#FFFFFF",
        ghostCursorOpacity: 100,
        ghostCursorSize: "medium",
        ghostCursorBubbleBg: "#FFFFFF",
        ghostCursorBubbleTextColor: "#000000",
        ghostCursorCustomImage: null,
        updateSettings: (updates) => set((state) => {
          Object.assign(state, updates);
        }),
        setSettings: (settings) => set((state) => {
          Object.assign(state, settings);
        })
      })),
      {
        name: "control-settings-storage"
      }
    ),
    { name: "SettingsStore", enabled: false }
  )
);
export {
  useSettingsStore as u
};
